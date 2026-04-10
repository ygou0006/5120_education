"""
Occupation Details Import Script - Step 1
Import data from Occupation profiles data - November 2025 (Revised).xlsx
Populates title, description, main_tasks, work_hours fields in occupations table
If occupation code does not exist, insert new record
"""

import pandas as pd
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Configuration
DATA_FILE = Path(__file__).parent / 'OPD' / 'Occupation profiles data - November 2025 (Revised).xlsx'

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
database_url = os.getenv('DATABASE_URL')


def extract_occupation_data():
    """Extract all occupation data from Excel"""
    print("Extracting occupation data from Excel...")
    
    # Table_2: description + title
    df_desc = pd.read_excel(DATA_FILE, sheet_name='Table_2', header=None, skiprows=7)
    df_desc.columns = ['anzsco_code', 'title', 'description', 'unused']
    df_desc = df_desc[df_desc['description'].notna()]
    # Only use 4-digit code records
    df_desc = df_desc[df_desc['anzsco_code'].astype(str).str.len() == 4]
    df_desc['code_4'] = df_desc['anzsco_code'].astype(str)
    print(f"  Table_2: {len(df_desc)} description records")
    
    # Table_3: tasks + title
    df_tasks = pd.read_excel(DATA_FILE, sheet_name='Table_3', header=None, skiprows=7)
    df_tasks.columns = ['anzsco_code', 'title', 'task', 'unused1', 'unused2']
    # Only use 4-digit code records
    df_tasks = df_tasks[df_tasks['anzsco_code'].astype(str).str.len() == 4]
    df_tasks['code_4'] = df_tasks['anzsco_code'].astype(str)
    df_tasks = df_tasks[df_tasks['task'].notna()]
    
    # Get title from Table_3 for codes not in Table_2
    df_tasks_titles = df_tasks[['code_4', 'title']].drop_duplicates('code_4')
    titles_from_tasks = dict(zip(df_tasks_titles['code_4'], df_tasks_titles['title']))
    
    # Merge tasks
    tasks_dict = {}
    for _, row in df_tasks.iterrows():
        code = row['code_4']
        if code not in tasks_dict:
            tasks_dict[code] = []
        tasks_dict[code].append(row['task'])
    
    tasks_combined = {code: "; ".join(tasks) for code, tasks in tasks_dict.items()}
    print(f"  Table_3: {len(tasks_combined)} occupation tasks")
    
    # Table_4: work_hours
    df_hours = pd.read_excel(DATA_FILE, sheet_name='Table_4', header=None, skiprows=7)
    df_hours.columns = ['anzsco_code', 'title', 'full_time_pct', 'avg_hours', 'unused1', 'unused2', 'unused3']
    # Only use 4-digit code records
    df_hours = df_hours[df_hours['anzsco_code'].astype(str).str.len() == 4]
    df_hours['code_4'] = df_hours['anzsco_code'].astype(str)
    df_hours = df_hours[df_hours['avg_hours'].notna()]
    df_hours['avg_hours'] = df_hours['avg_hours'].astype(int)
    
    hours_dict = dict(zip(df_hours['code_4'], df_hours['avg_hours']))
    print(f"  Table_4: {len(hours_dict)} work hours records")
    
    # Integrate all data
    all_codes = set(df_desc['code_4'].tolist()) | set(tasks_dict.keys()) | set(hours_dict.keys())
    print(f"  Found {len(all_codes)} occupation codes")
    
    # Build complete data dictionary
    occupation_data = {}
    for code in all_codes:
        # Get title and description from Table_2
        desc_row = df_desc[df_desc['code_4'] == code]
        title = desc_row['title'].iloc[0] if len(desc_row) > 0 else None
        description = desc_row['description'].iloc[0] if len(desc_row) > 0 else None
        
        # If Table_2 has no title, get from Table_3
        if not title and code in titles_from_tasks:
            title = titles_from_tasks[code]
        
        occupation_data[code] = {
            'title': title,
            'description': description,
            'main_tasks': tasks_combined.get(code),
            'work_hours': hours_dict.get(code)
        }
    
    return occupation_data


def import_to_database(occupation_data):
    """Import data to database"""
    print("\n" + "=" * 60)
    print("Starting occupation data import to database")
    print("=" * 60)
    
    engine = create_engine(database_url)
    
    inserted_count = 0
    updated_count = 0
    no_change_count = 0
    
    with engine.connect() as conn:
        for code_4, data in occupation_data.items():
            # Check if exists
            existing = conn.execute(
                text("SELECT id, title, description, main_tasks, work_hours FROM occupations WHERE SUBSTRING(anzsco_code,1,4) = :code"),
                {"code": code_4}
            ).fetchone()
            
            if existing is None:
                # Skip records without title (no valid data)
                if not data['title'] and not data['description'] and not data['main_tasks']:
                    continue
                
                # INSERT new record
                conn.execute(
                    text("""
                        INSERT INTO occupations (anzsco_code, title, description, main_tasks, work_hours, is_active, created_at)
                        VALUES (:code, :title, :desc, :tasks, :hours, TRUE, NOW())
                    """),
                    {
                        "code": code_4,
                        "title": data['title'] if data['title'] else None,
                        "desc": data['description'] if data['description'] else None,
                        "tasks": data['main_tasks'] if data['main_tasks'] else None,
                        "hours": str(data['work_hours']) if data['work_hours'] else None
                    }
                )
                inserted_count += 1
            else:
                # UPDATE empty fields
                occ_id, old_title, old_desc, old_tasks, old_hours = existing
                
                updates = []
                params = {'id': occ_id}
                
                # title: prefer Excel data
                if data['title'] and (old_title is None or old_title == ''):
                    updates.append('title = :title')
                    params['title'] = data['title']
                
                # description: only update if empty
                if data['description'] and (old_desc is None or old_desc == ''):
                    updates.append('description = :desc')
                    params['desc'] = data['description']
                
                # main_tasks: only update if empty
                if data['main_tasks'] and (old_tasks is None or old_tasks == ''):
                    updates.append('main_tasks = :tasks')
                    params['tasks'] = data['main_tasks']
                
                # work_hours: only update if empty
                if data['work_hours'] and (old_hours is None or old_hours == ''):
                    updates.append('work_hours = :hours')
                    params['hours'] = str(data['work_hours'])
                
                if updates:
                    sql = f"UPDATE occupations SET {', '.join(updates)} WHERE id = :id"
                    conn.execute(text(sql), params)
                    updated_count += 1
                else:
                    no_change_count += 1
        
        conn.commit()
    
    print(f"\nImport completed:")
    print(f"  Inserted: {inserted_count} records")
    print(f"  Updated: {updated_count} records")
    print(f"  No change: {no_change_count} records")


def verify_import():
    """Verify import results"""
    print("\nVerifying import results:")
    print("-" * 40)
    
    engine = create_engine(database_url)
    with engine.connect() as conn:
        # Statistics
        result = conn.execute(text('''
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN title IS NOT NULL AND title != '' THEN 1 ELSE 0 END) as has_title,
                SUM(CASE WHEN description IS NOT NULL AND description != '' THEN 1 ELSE 0 END) as has_desc,
                SUM(CASE WHEN main_tasks IS NOT NULL AND main_tasks != '' THEN 1 ELSE 0 END) as has_tasks,
                SUM(CASE WHEN work_hours IS NOT NULL AND work_hours != '' THEN 1 ELSE 0 END) as has_hours
            FROM occupations
        '''))
        row = result.fetchone()
        print(f"  Total records: {row[0]}")
        print(f"  title filled: {row[1]}/{row[0]}")
        print(f"  description filled: {row[2]}/{row[0]}")
        print(f"  main_tasks filled: {row[3]}/{row[0]}")
        print(f"  work_hours filled: {row[4]}/{row[0]}")
        
        # Sample data
        print("\nSample data:")
        result = conn.execute(text('''
            SELECT anzsco_code, title, work_hours, description
            FROM occupations 
            WHERE title IS NOT NULL AND title != ''
            LIMIT 3
        '''))
        for row in result:
            print(f"  {row[0]} - {row[1]} ({row[2]} hours/week)")
            print(f"    {row[3][:60]}..." if row[3] and len(row[3]) > 60 else f"    {row[3]}")


def main():
    print("=" * 60)
    print("Step 1: Occupation Details Import Script")
    print("=" * 60)
    print(f"Data file: {DATA_FILE}")
    print()
    
    # Test database connection
    try:
        engine = create_engine(database_url)
        conn = engine.connect()
        print("Database connection successful\n")
        conn.close()
    except Exception as e:
        print(f"Database connection failed: {e}")
        return
    
    # Extract data
    occupation_data = extract_occupation_data()
    
    # Import to database
    import_to_database(occupation_data)
    
    # Verify
    verify_import()
    
    print("\n" + "=" * 60)
    print("Import completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
