"""
Employment Projections Data Import Script
Import Table_6 Occupation Unit Group (4-digit ANZSCO only) to database
Matches ANZSCO code with occupations table
"""

import pandas as pd
import re
import warnings
warnings.filterwarnings('ignore')

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from pathlib import Path

env_path = Path('..') / '.env'
load_dotenv(dotenv_path=env_path)
database_url = os.getenv('DATABASE_URL')

# =====================================================
# Configuration
# =====================================================
BASE_DIR = Path(__file__).parent / 'EP'
FILE_NAME = 'employment_projections_-_may_2025_to_may_2035.xlsx'


# =====================================================
# Parse Table_6 - Only 4-digit ANZSCO codes
# =====================================================

def parse_employment_projections(file_path):
    """
    Parse Table_6 Occupation Unit Group
    Only extract rows with 4-digit ANZSCO codes
    """
    print(f"\nParsing: {file_path}")
    
    # Read the Excel file with header at row 7
    df = pd.read_excel(file_path, sheet_name='Table_6 Occupation Unit Group', header=7)
    
    print(f"  Columns found: {len(df.columns)}")
    
    # Clean data - remove empty rows based on ANZSCO Code column (index 2)
    df = df[df.iloc[:, 2].notna()].reset_index(drop=True)
    
    # Remove rows where ANZSCO Code is not a number
    df = df[pd.to_numeric(df.iloc[:, 2], errors='coerce').notna()]
    
    # Select only the first 12 columns (data columns)
    df = df.iloc[:, :12]
    
    # Rename columns based on actual column names
    column_mapping = {
        'Occupation Level': 'occupation_level',
        'NFD Indicator': 'nfd_indicator', 
        'ANZSCO Code': 'anzsco_code',
        'Occupation': 'occupation',
        'Skill level 1': 'skill_level',
        'Baseline': 'employment_2025',
        'Projected': 'employment_2030',
        'Projected.1': 'employment_2035',
        '5-Year Change': 'change_5yr_level',
        'Unnamed: 9': 'change_5yr_pct',
        '10-Year Change': 'change_10yr_level',
        'Unnamed: 11': 'change_10yr_pct'
    }
    
    # Rename columns
    df = df.rename(columns=column_mapping)
    
    # Convert occupation_level to numeric
    df['occupation_level'] = pd.to_numeric(df['occupation_level'], errors='coerce')
    
    # Convert ANZSCO code: from number like 1000.0 to string "1000"
    # This is the key fix - convert the numeric ANZSCO code to string properly
    df['anzsco_code'] = pd.to_numeric(df['anzsco_code'], errors='coerce').fillna(0).astype(int).astype(str)
    
    # Filter to rows where occupation_level = 4 (4-digit ANZSCO level)
    df = df[df['occupation_level'] == 4].copy()
    
    print(f"  Rows with occupation_level=4: {len(df)}")
    
    # Filter to valid 4-digit codes (1000-9999 range)
    df['anzsco_code_int'] = pd.to_numeric(df['anzsco_code'], errors='coerce')
    df = df[(df['anzsco_code_int'] >= 1000) & (df['anzsco_code_int'] <= 9999)].copy()
    
    print(f"  Rows with valid 4-digit codes (1000-9999): {len(df)}")
    
    # Convert numeric columns
    numeric_cols = ['employment_2025', 'employment_2030', 'employment_2035',
                    'change_5yr_level', 'change_5yr_pct', 'change_10yr_level', 'change_10yr_pct']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Extract skill level (first number if multiple, or convert to int)
    def extract_skill_level(val):
        if pd.isna(val):
            return None
        try:
            # Try direct conversion first
            return int(float(val))
        except (ValueError, TypeError):
            # If that fails, extract first number from string
            val_str = str(val).strip()
            match = re.search(r'(\d+)', val_str)
            return int(match.group(1)) if match else None
    
    df['skill_level'] = df['skill_level'].apply(extract_skill_level)
    
    # Prepare records
    records = []
    for _, row in df.iterrows():
        # Format ANZSCO code as 4-digit string with leading zeros if needed
        anzsco_code = str(int(row['anzsco_code_int'])).zfill(4)
        
        record = {
            'anzsco_code': anzsco_code,
            'employment_2025': row.get('employment_2025'),
            'employment_2030': row.get('employment_2030'),
            'employment_2035': row.get('employment_2035'),
            'change_5yr_level': row.get('change_5yr_level'),
            'change_5yr_pct': row.get('change_5yr_pct'),
            'change_10yr_level': row.get('change_10yr_level'),
            'change_10yr_pct': row.get('change_10yr_pct'),
        }
        records.append(record)
    
    print(f"  Extracted {len(records)} records (4-digit ANZSCO codes)")
    
    # Show first few records as sample
    if records:
        print("\n  Sample records (first 10):")
        for i, record in enumerate(records[:10]):
            print(f"    {record['anzsco_code']}: 2025={record['employment_2025']:.0f}k, "
                  f"2030={record['employment_2030']:.0f}k, 2035={record['employment_2035']:.0f}k")
    
    return records


# =====================================================
# Get occupation mapping from database
# =====================================================

def get_occupation_mapping(engine):
    """Get ANZSCO code (4-digit) to occupation_id mapping"""
    mapping = {}
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, anzsco_code FROM occupations WHERE is_active = TRUE"))
        for row in result:
            code = row[1]
            # occupations table stores 4-digit codes
            if len(code) >= 4:
                mapping[code[:4]] = row[0]
    return mapping


# =====================================================
# Create table if not exists
# =====================================================

def create_table_if_not_exists(engine):
    """Create employment_projections table if not exists"""
    with engine.connect() as conn:
        # Check if table exists
        result = conn.execute(text("""
            SELECT COUNT(*)
            FROM information_schema.tables 
            WHERE table_schema = DATABASE()
            AND table_name = 'employment_projections'
        """))
        exists = result.fetchone()[0] > 0
        
        if not exists:
            print("\nCreating employment_projections table...")
            conn.execute(text("""
                CREATE TABLE employment_projections (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    occupation_id INT NOT NULL,
                    year_2025_employment DECIMAL(12,2),
                    year_2030_employment DECIMAL(12,2),
                    year_2035_employment DECIMAL(12,2),
                    change_5yr_level DECIMAL(12,2),
                    change_5yr_pct DECIMAL(10,4),
                    change_10yr_level DECIMAL(12,2),
                    change_10yr_pct DECIMAL(10,4),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_occupation (occupation_id),
                    INDEX idx_occupation_id (occupation_id)
                )
            """))
            conn.commit()
            print("  Table created successfully")
        else:
            print("\nemployment_projections table already exists")


# =====================================================
# Import data to database
# =====================================================

def import_employment_projections(records, occupation_map, engine):
    """Import employment projection data"""
    print("\n" + "=" * 60)
    print("Importing Employment Projections")
    print("=" * 60)
    
    inserted = 0
    updated = 0
    skipped = 0
    not_found_codes = set()
    
    with engine.connect() as conn:
        for i, record in enumerate(records):
            anzsco_code = record['anzsco_code']
            occupation_id = occupation_map.get(anzsco_code)
            
            if occupation_id is None:
                not_found_codes.add(anzsco_code)
                skipped += 1
                continue
            
            # Check if record exists
            existing = conn.execute(
                text("SELECT id FROM employment_projections WHERE occupation_id = :occ_id"),
                {"occ_id": occupation_id}
            ).fetchone()
            
            if existing is None:
                conn.execute(
                    text("""
                        INSERT INTO employment_projections 
                        (occupation_id, year_2025_employment, year_2030_employment, year_2035_employment,
                         change_5yr_level, change_5yr_pct, change_10yr_level, change_10yr_pct)
                        VALUES (:occ_id, :emp2025, :emp2030, :emp2035,
                                :chg5l, :chg5p, :chg10l, :chg10p)
                    """),
                    {
                        "occ_id": occupation_id,
                        "emp2025": record['employment_2025'],
                        "emp2030": record['employment_2030'],
                        "emp2035": record['employment_2035'],
                        "chg5l": record['change_5yr_level'],
                        "chg5p": record['change_5yr_pct'],
                        "chg10l": record['change_10yr_level'],
                        "chg10p": record['change_10yr_pct']
                    }
                )
                inserted += 1
            else:
                conn.execute(
                    text("""
                        UPDATE employment_projections 
                        SET year_2025_employment = :emp2025,
                            year_2030_employment = :emp2030,
                            year_2035_employment = :emp2035,
                            change_5yr_level = :chg5l,
                            change_5yr_pct = :chg5p,
                            change_10yr_level = :chg10l,
                            change_10yr_pct = :chg10p,
                            updated_at = NOW()
                        WHERE occupation_id = :occ_id
                    """),
                    {
                        "occ_id": occupation_id,
                        "emp2025": record['employment_2025'],
                        "emp2030": record['employment_2030'],
                        "emp2035": record['employment_2035'],
                        "chg5l": record['change_5yr_level'],
                        "chg5p": record['change_5yr_pct'],
                        "chg10l": record['change_10yr_level'],
                        "chg10p": record['change_10yr_pct']
                    }
                )
                updated += 1
            
            if (inserted + updated) % 50 == 0:
                conn.commit()
        
        conn.commit()
    
    # Report unmatched codes
    if not_found_codes:
        print(f"\n  Warning: {len(not_found_codes)} ANZSCO codes not found in occupations table:")
        for code in sorted(list(not_found_codes))[:20]:
            print(f"    - {code}")
        if len(not_found_codes) > 20:
            print(f"    ... and {len(not_found_codes) - 20} more")
    
    print(f"\n  Import completed:")
    print(f"    - Inserted: {inserted}")
    print(f"    - Updated: {updated}")
    print(f"    - Skipped (no match): {skipped}")
    
    return inserted + updated


# =====================================================
# Verify import
# =====================================================

def verify_import(engine):
    """Verify import results"""
    print("\n" + "=" * 60)
    print("Verifying Import")
    print("=" * 60)
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM employment_projections"))
        total = result.fetchone()[0]
        print(f"Total records in employment_projections: {total}")
        
        if total > 0:
            print("\nSample data (top 10 by employment 2025):")
            result = conn.execute(text("""
                SELECT o.anzsco_code, o.title, 
                       ep.year_2025_employment, ep.year_2030_employment, ep.year_2035_employment,
                       ep.change_10yr_pct
                FROM employment_projections ep
                JOIN occupations o ON ep.occupation_id = o.id
                WHERE ep.year_2025_employment IS NOT NULL
                ORDER BY ep.year_2025_employment DESC
                LIMIT 10
            """))
            
            for row in result:
                change_str = f"{row[5]:.2%}" if row[5] is not None else "N/A"
                print(f"    {row[0]} - {row[1][:40]}: "
                      f"2025: {row[2]:,.0f}k, 2030: {row[3]:,.0f}k, 2035: {row[4]:,.0f}k, "
                      f"10yr chg: {change_str}")
    
    print("=" * 60)


# =====================================================
# Main
# =====================================================

def main():
    print("=" * 60)
    print("Employment Projections Import (4-digit ANZSCO only)")
    print("=" * 60)
    
    # Connect to database
    try:
        engine = create_engine(database_url)
        with engine.connect() as conn:
            print("Database connection successful")
    except Exception as e:
        print(f"Database connection failed: {e}")
        return
    
    # Create table if not exists
    create_table_if_not_exists(engine)
    
    # Get occupation mapping
    occupation_map = get_occupation_mapping(engine)
    print(f"\nFound {len(occupation_map)} 4-digit ANZSCO codes in occupations table")
    
    # Parse Excel
    file_path = BASE_DIR / FILE_NAME
    if not file_path.exists():
        print(f"\nFile not found: {file_path}")
        print("Please check the file path")
        return

    records = parse_employment_projections(str(file_path))
    
    if not records:
        print("\nNo records to import")
        return
    
    # Import
    import_employment_projections(records, occupation_map, engine)
    
    # Verify
    verify_import(engine)
    
    print("\nImport completed!")


if __name__ == "__main__":
    main()
