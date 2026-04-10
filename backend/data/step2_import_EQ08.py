"""
EQ08 Data Import Script - 4-digit ANZSCO code version
Automatically aggregates male and female counts to get total employment
Automatically calculates year-over-year growth rate and employment share
Automatically calculates male/female ratio
Dual import:
- employment_data: National total (calculated by aggregating states)
- regional_employment: State data (NSW, VIC, QLD, etc.)
"""

import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
import re
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

import os
from dotenv import load_dotenv
from pathlib import Path
env_path = Path('..') / '.env'
load_dotenv(dotenv_path=env_path)
database_url = os.getenv('DATABASE_URL')

# =====================================================
# Configuration parameters - please modify as needed
# =====================================================

# File path
EQ08_FILE_PATH = 'EQ08/EQ08.xlsx'  # EQ08 file path

# =====================================================
# Import limit configuration
# =====================================================

# Maximum number of occupations to import (only import first N occupations)
MAX_OCCUPATIONS = 500

# Maximum number of years to import (only import most recent N years)
MAX_YEARS = 10

# Whether to import only specific occupations (leave empty to import all)
# Example: ['1111', '2613', '2211']
TARGET_OCCUPATIONS = []

# List of states to aggregate (for calculating national total)
STATES_LIST = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT']


# =====================================================
# Database connection
# =====================================================

def get_db_engine():
    """Create database engine"""
    return create_engine(database_url)

def get_occupation_mapping(engine):
    """Get ANZSCO code to occupation_id mapping (supports 4-digit code matching)"""
    mapping = {}
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, anzsco_code FROM occupations"))
        for row in result:
            code = row[1]
            mapping[code] = row[0]  # 6-digit code mapping
            # Also store 4-digit version (take first 4 digits)
            if len(code) >= 4:
                mapping[code[:4]] = row[0]  # 4-digit code also maps to same occupation
    return mapping


# =====================================================
# Parse EQ08 Excel file
# =====================================================

def parse_eq08_file(file_path):
    """
    Parse EQ08 Excel file and extract employment data
    Returns two datasets: national data (aggregated from states), state data
    Only processes occupations that exist in database
    """
    print(f"Parsing EQ08 file: {file_path}")
    
    # Get existing occupation codes from database first
    engine = get_db_engine()
    existing_codes = set()
    with engine.connect() as conn:
        result = conn.execute(text("SELECT anzsco_code FROM occupations"))
        for row in result:
            code = str(row[0])
            existing_codes.add(code)
            if len(code) >= 4:
                existing_codes.add(code[:4])
    print(f"  Database has {len(existing_codes)} occupation codes")
    
    # Read Excel file
    excel_file = pd.ExcelFile(file_path)
    print(f"Found {len(excel_file.sheet_names)} worksheets")
    
    all_regional_records = []   # Raw state data (for aggregating to national)
    
    # Iterate through each worksheet, first collect all state data
    for sheet_idx, sheet_name in enumerate(excel_file.sheet_names):
        print(f"  Processing worksheet {sheet_idx + 1}/{len(excel_file.sheet_names)}: {sheet_name}")
        
        try:
            df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
            regional = parse_regional_data(df, sheet_name, existing_codes)
            all_regional_records.extend(regional)
            print(f"    Extracted {len(regional)} state records from this worksheet, total {len(all_regional_records)}")
        except Exception as e:
            print(f"    Parse failed: {e}")
            continue
    
    print(f"Parsing completed, extracted {len(all_regional_records)} state records\n")
    
    # Calculate national data from state data
    national_records = calculate_national_from_regional(all_regional_records)
    
    return national_records, all_regional_records

def parse_regional_data(df, sheet_name, existing_codes=None):
    """
    Parse EQ08 data and extract state employment data (aggregated by state, occupation, year, gender)
    Only extracts state data defined in STATES_LIST
    Only processes occupations that exist in database
    """
    if existing_codes is None:
        existing_codes = set()
    
    # Data structure for aggregation
    regional_aggregated = {}   # key = (code, title, year, state, sex)
    
    # 4-digit ANZSCO code pattern
    anzsco_pattern = r'^(\d{4})\s+(.+)$'
    
    processed_occupations = set()
    
    # Iterate through all rows
    for row_idx in range(len(df)):
        row = df.iloc[row_idx]
        
        if len(row) < 5:
            continue
        
        # Column 4 (index 3) is occupation code + name
        occupation_cell = row[3] if len(row) > 3 else None
        if pd.isna(occupation_cell):
            continue
        
        occupation_str = str(occupation_cell).strip()
        
        # Match 4-digit ANZSCO code and occupation name
        match = re.match(anzsco_pattern, occupation_str)
        if not match:
            continue
        
        anzsco_code = match.group(1)  # 4-digit code
        occupation_title = match.group(2).strip()  # Occupation name
        
        # Only process occupations that exist in database
        if existing_codes and anzsco_code not in existing_codes:
            continue
        
        # Occupation count limit
        if MAX_OCCUPATIONS and len(processed_occupations) >= MAX_OCCUPATIONS:
            if anzsco_code not in processed_occupations:
                continue
        
        # Target occupation filter
        if TARGET_OCCUPATIONS and anzsco_code not in TARGET_OCCUPATIONS:
            continue
        
        # Extract quarter/year (column 0)
        date_cell = row[0] if len(row) > 0 else None
        if pd.isna(date_cell):
            continue
        
        year = extract_year_from_date(date_cell)
        if not year:
            continue
        
        # Year limit
        current_year = datetime.now().year
        if MAX_YEARS and year < current_year - MAX_YEARS:
            continue
        
        # Extract gender (column 1)
        sex_cell = row[1] if len(row) > 1 else None
        sex = str(sex_cell).strip() if not pd.isna(sex_cell) else None
        # Normalize gender format
        if sex == 'Males':
            sex = 'M'
        elif sex == 'Females':
            sex = 'F'
        else:
            continue  # Skip rows with unrecognized gender
        
        # Extract state (column 2)
        state_cell = row[2] if len(row) > 2 else None
        state = extract_state(str(state_cell)) if not pd.isna(state_cell) else None
        
        # Only process states we need to aggregate
        if state not in STATES_LIST:
            continue
        
        # Extract employment count (column 4, unit is '000)
        employment_cell = row[4] if len(row) > 4 else None
        if pd.isna(employment_cell):
            continue
        
        try:
            employment_value = float(employment_cell)
            employment_count = int(employment_value * 1000)  # Convert to actual count
        except (ValueError, TypeError):
            continue
        
        if employment_count <= 0:
            continue
        
        # Aggregate state data (by occupation + year + state + gender)
        regional_key = (anzsco_code, occupation_title, year, state, sex)
        if regional_key not in regional_aggregated:
            regional_aggregated[regional_key] = 0
        regional_aggregated[regional_key] += employment_count
        
        processed_occupations.add(anzsco_code)
    
    # Convert to record list (aggregated by state, occupation, year)
    # First aggregate by (code, title, year, state), while recording male and female counts
    temp_dict = {}  # key = (code, title, year, state), value = {'M': count, 'F': count, 'total': count}
    
    for (code, title, year, state, sex), count in regional_aggregated.items():
        key = (code, title, year, state)
        if key not in temp_dict:
            temp_dict[key] = {'M': 0, 'F': 0, 'total': 0}
        if sex == 'M':
            temp_dict[key]['M'] += count
        elif sex == 'F':
            temp_dict[key]['F'] += count
        temp_dict[key]['total'] += count
    
    regional_records = []
    for (code, title, year, state), data in temp_dict.items():
        regional_records.append({
            'anzsco_code': code,
            'title': title,
            'year': year,
            'state': state,
            'employment_count': data['total'],
            'male_count': data['M'],
            'female_count': data['F']
        })
    
    return regional_records

def calculate_national_from_regional(regional_records):
    """
    Calculate national total from state data
    Sum employment counts from all states by occupation and year
    """
    national_aggregated = {}  # key = (code, title, year)
    
    for record in regional_records:
        key = (record['anzsco_code'], record['title'], record['year'])
        if key not in national_aggregated:
            national_aggregated[key] = {
                'total': 0,
                'male': 0,
                'female': 0
            }
        national_aggregated[key]['total'] += record['employment_count']
        national_aggregated[key]['male'] += record['male_count']
        national_aggregated[key]['female'] += record['female_count']
    
    national_records = []
    for (code, title, year), data in national_aggregated.items():
        # Calculate male/female ratio
        male_percentage = None
        female_percentage = None
        total = data['total']
        if total > 0:
            male_percentage = round((data['male'] / total) * 100, 1)
            female_percentage = round((data['female'] / total) * 100, 1)
        
        national_records.append({
            'anzsco_code': code,
            'title': title,
            'year': year,
            'employment_count': total,
            'male_percentage': male_percentage,
            'female_percentage': female_percentage
        })
    
    # Sort by year
    national_records = sorted(national_records, key=lambda x: x['year'])
    
    print(f"Aggregated national data: {len(national_records)} records")
    return national_records

def extract_year_from_date(date_cell):
    """
    Extract year from date cell
    Example: "Aug-1986" -> 1986
    """
    if pd.isna(date_cell):
        return None
    
    date_str = str(date_cell).strip()
    
    # Match year in "Aug-1986" format
    match = re.search(r'(\d{4})', date_str)
    if match:
        return int(match.group(1))
    
    return None

def extract_state(state_str):
    """
    Extract state code
    """
    if not state_str:
        return None
    
    state_map = {
        'New South Wales': 'NSW',
        'Victoria': 'VIC',
        'Queensland': 'QLD',
        'South Australia': 'SA',
        'Western Australia': 'WA',
        'Tasmania': 'TAS',
        'Northern Territory': 'NT',
        'Australian Capital Territory': 'ACT'
    }
    
    for full_name, code in state_map.items():
        if full_name in state_str:
            return code
    
    return None


# =====================================================
# Import data to database
# =====================================================

def import_national_data(records):
    """
    Import national employment data to employment_data table
    Includes male/female ratio
    """
    print("Importing national employment data to employment_data table...")
    
    engine = get_db_engine()
    
    # Get occupation mapping
    occupation_map = get_occupation_mapping(engine)
    print(f"  Found {len(occupation_map)} occupation mappings")
    
    inserted_count = 0
    skipped_count = 0
    error_count = 0
    
    with engine.connect() as conn:
        for i, record in enumerate(records):
            if (i + 1) % 100 == 0:
                print(f"    Progress: {i + 1}/{len(records)}")
            
            # Find occupation ID
            occupation_id = occupation_map.get(record['anzsco_code'])
            
            if occupation_id is None:
                skipped_count += 1
                continue
            
            try:
                # Check if already exists
                existing = conn.execute(
                    text("""
                        SELECT id FROM employment_data 
                        WHERE occupation_id = :occ_id AND year = :year
                    """),
                    {
                        "occ_id": occupation_id,
                        "year": record['year']
                    }
                ).fetchone()
                
                if existing is None:
                    conn.execute(
                        text("""
                            INSERT INTO employment_data 
                            (occupation_id, year, employment_count, 
                             female_percentage, male_percentage, created_at)
                            VALUES (:occ_id, :year, :employment, 
                                    :female_pct, :male_pct, NOW())
                        """),
                        {
                            "occ_id": occupation_id,
                            "year": record['year'],
                            "employment": record['employment_count'],
                            "female_pct": record['female_percentage'],
                            "male_pct": record['male_percentage']
                        }
                    )
                    inserted_count += 1
                else:
                    conn.execute(
                        text("""
                            UPDATE employment_data 
                            SET employment_count = :employment,
                                female_percentage = :female_pct,
                                male_percentage = :male_pct
                            WHERE occupation_id = :occ_id AND year = :year
                        """),
                        {
                            "occ_id": occupation_id,
                            "year": record['year'],
                            "employment": record['employment_count'],
                            "female_pct": record['female_percentage'],
                            "male_pct": record['male_percentage']
                        }
                    )
                    inserted_count += 1
                
                if inserted_count % 100 == 0:
                    conn.commit()
                    
            except Exception as e:
                error_count += 1
                print(f"    Error: {record['anzsco_code']} - {record['year']}: {e}")
        
        conn.commit()
    
    print(f"  Import completed: Inserted/Updated {inserted_count} records, Skipped {skipped_count} records, Errors {error_count} records\n")
    return inserted_count

def import_regional_data(records, national_records):
    """
    Import state employment data to regional_employment table
    Automatically calculates year-over-year growth rate and employment share
    national_records: National data, used for calculating share
    """
    print("Importing state employment data to regional_employment table...")
    
    engine = get_db_engine()
    
    # Get occupation mapping
    occupation_map = get_occupation_mapping(engine)
    print(f"  Found {len(occupation_map)} occupation mappings")
    
    # Build national total lookup dict for quick share calculation
    # Data structure: { (anzsco_code, year): national_count }
    national_dict = {}
    for record in national_records:
        key = (record['anzsco_code'], record['year'])
        national_dict[key] = record['employment_count']
    
    # Group by occupation and state first, for growth rate calculation
    # Data structure: { (anzsco_code, state): {year: employment_count} }
    yearly_data = {}
    for record in records:
        key = (record['anzsco_code'], record['state'])
        if key not in yearly_data:
            yearly_data[key] = {}
        yearly_data[key][record['year']] = record['employment_count']
    
    inserted_count = 0
    skipped_count = 0
    error_count = 0
    
    with engine.connect() as conn:
        for i, record in enumerate(records):
            if (i + 1) % 100 == 0:
                print(f"    Progress: {i + 1}/{len(records)}")
            
            # Find occupation ID
            occupation_id = occupation_map.get(record['anzsco_code'])
            
            if occupation_id is None:
                skipped_count += 1
                continue
            
            # Calculate growth rate
            growth_rate = calculate_growth_rate(
                yearly_data, 
                record['anzsco_code'], 
                record['state'], 
                record['year'], 
                record['employment_count']
            )
            
            # Calculate employment share
            national_key = (record['anzsco_code'], record['year'])
            national_total = national_dict.get(national_key)
            employment_share = calculate_employment_share(
                record['employment_count'], 
                national_total
            )
            
            try:
                # Check if already exists
                existing = conn.execute(
                    text("""
                        SELECT id FROM regional_employment 
                        WHERE occupation_id = :occ_id AND state = :state AND year = :year
                    """),
                    {
                        "occ_id": occupation_id,
                        "state": record['state'],
                        "year": record['year']
                    }
                ).fetchone()
                
                if existing is None:
                    conn.execute(
                        text("""
                            INSERT INTO regional_employment 
                            (occupation_id, state, employment_count, growth_rate, employment_share, year, created_at)
                            VALUES (:occ_id, :state, :employment, :growth_rate, :share, :year, NOW())
                        """),
                        {
                            "occ_id": occupation_id,
                            "state": record['state'],
                            "year": record['year'],
                            "employment": record['employment_count'],
                            "growth_rate": growth_rate,
                            "share": employment_share
                        }
                    )
                    inserted_count += 1
                else:
                    conn.execute(
                        text("""
                            UPDATE regional_employment 
                            SET employment_count = :employment, 
                                growth_rate = :growth_rate, 
                                employment_share = :share, 
                                updated_at = NOW()
                            WHERE occupation_id = :occ_id AND state = :state AND year = :year
                        """),
                        {
                            "occ_id": occupation_id,
                            "state": record['state'],
                            "year": record['year'],
                            "employment": record['employment_count'],
                            "growth_rate": growth_rate,
                            "share": employment_share
                        }
                    )
                    inserted_count += 1
                
                if inserted_count % 100 == 0:
                    conn.commit()
                    
            except Exception as e:
                error_count += 1
                print(f"    Error: {record['anzsco_code']} - {record['state']} - {record['year']}: {e}")
        
        conn.commit()
    
    print(f"  Import completed: Inserted/Updated {inserted_count} records, Skipped {skipped_count} records, Errors {error_count} records\n")
    return inserted_count

def calculate_growth_rate(yearly_data, anzsco_code, state, current_year, current_count):
    """
    Calculate year-over-year growth rate
    """
    key = (anzsco_code, state)
    
    # Get previous year data
    previous_year = current_year - 1
    previous_count = yearly_data.get(key, {}).get(previous_year)
    
    if previous_count is None or previous_count == 0:
        return None  # No previous year data, cannot calculate
    
    # Calculate growth rate
    growth_rate = ((current_count - previous_count) / previous_count) * 100
    
    # Keep two decimal places
    return round(growth_rate, 2)

def calculate_employment_share(state_count, national_count):
    """
    Calculate employment share
    state_count: State employment count
    national_count: National total employment count
    Returns: Percentage, one decimal place
    """
    if national_count is None or national_count == 0:
        return None
    
    share = (state_count / national_count) * 100
    return round(share, 1)


# =====================================================
# Verify import results
# =====================================================

def verify_import():
    """Verify import results"""
    print("\n" + "=" * 60)
    print("Verifying import results")
    print("=" * 60)
    
    engine = get_db_engine()
    
    with engine.connect() as conn:
        # Count employment_data
        result = conn.execute(text("SELECT COUNT(*) FROM employment_data"))
        national_total = result.fetchone()[0]
        print(f"employment_data (national data) total records: {national_total}")
        
        # Count regional_employment
        result = conn.execute(text("SELECT COUNT(*) FROM regional_employment"))
        regional_total = result.fetchone()[0]
        print(f"regional_employment (state data) total records: {regional_total}")
        
        # Count occupations
        result = conn.execute(text("SELECT COUNT(DISTINCT occupation_id) FROM employment_data"))
        national_occ = result.fetchone()[0]
        print(f"National data occupations: {national_occ}")
        
        # Year range
        result = conn.execute(text("SELECT MIN(year), MAX(year) FROM employment_data"))
        min_year, max_year = result.fetchone()
        print(f"Year range: {min_year} - {max_year}")
        
        # Show national data sample (with male/female ratio)
        print("\nNational data sample (employment_data):")
        result = conn.execute(text("""
            SELECT o.anzsco_code, o.title, e.year, e.employment_count, 
                   e.female_percentage, e.male_percentage
            FROM employment_data e
            JOIN occupations o ON e.occupation_id = o.id
            ORDER BY e.year DESC, e.employment_count DESC
            LIMIT 5
        """))
        for row in result:
            female_info = f", Female: {row[4]}%" if row[4] is not None else ""
            male_info = f", Male: {row[5]}%" if row[5] is not None else ""
            print(f"    {row[0]} - {row[1][:40]}: {row[2]} year, {row[3]:,} people{female_info}{male_info}")
        
        # Show state data sample (with growth rate and share)
        print("\nState data sample (regional_employment):")
        result = conn.execute(text("""
            SELECT o.anzsco_code, o.title, r.state, r.year, r.employment_count, r.growth_rate, r.employment_share
            FROM regional_employment r
            JOIN occupations o ON r.occupation_id = o.id
            ORDER BY r.year DESC, r.employment_count DESC
            LIMIT 5
        """))
        for row in result:
            growth_info = f", Growth: {row[5]}%" if row[5] is not None else ""
            share_info = f", Share: {row[6]}%" if row[6] is not None else ""
            print(f"    {row[0]} - {row[1][:30]}: {row[2]}, {row[3]} year, {row[4]:,} people{growth_info}{share_info}")
    
    print("=" * 60)


# =====================================================
# Clean invalid data
# =====================================================

def clean_invalid_occupations():
    """
    Clean invalid occupation data generated during import (e.g., 999661, etc.)
    """
    print("\nCleaning invalid occupation data...")
    
    engine = get_db_engine()
    
    with engine.connect() as conn:
        # Delete invalid codes starting with 999 or 998
        result = conn.execute(
            text("DELETE FROM occupations WHERE anzsco_code LIKE '999%' OR anzsco_code LIKE '998%'")
        )
        conn.commit()
        print(f"  Deleted {result.rowcount} invalid occupations")
        
        # Delete codes that are not 4 or 6 digits
        result = conn.execute(
            text("DELETE FROM occupations WHERE LENGTH(anzsco_code) NOT IN (4, 6)")
        )
        conn.commit()
        print(f"  Deleted {result.rowcount} codes with abnormal length")


# =====================================================
# Main function
# =====================================================

def main():
    """Main function"""
    print("=" * 60)
    print("EQ08 Data Import Script - Dual Import Version")
    print("National data: Aggregated from states (includes male/female ratio)")
    print("State data: Auto-calculated year-over-year growth rate and employment share")
    print("=" * 60)
    print()
    
    # Show configuration
    print("Import configuration:")
    print(f"  Max occupations: {MAX_OCCUPATIONS if MAX_OCCUPATIONS else 'Unlimited'}")
    print(f"  Max years: {MAX_YEARS if MAX_YEARS else 'Unlimited'} (last {MAX_YEARS} years)")
    print(f"  States to aggregate: {', '.join(STATES_LIST)}")
    if TARGET_OCCUPATIONS:
        print(f"  Target occupations: {', '.join(TARGET_OCCUPATIONS)}")
    print()
    
    # Test database connection
    try:
        conn = get_db_engine().connect()
        print("Database connection successful\n")
        conn.close()
    except Exception as e:
        print(f"Database connection failed: {e}")
        print("Please check database configuration")
        return
    
    # Parse EQ08 file
    national_records, regional_records = parse_eq08_file(EQ08_FILE_PATH)
    
    if not national_records and not regional_records:
        print("No valid data found")
        return
    
    print(f"Aggregation results: National data {len(national_records)} records, State data {len(regional_records)} records")
    
    # Import national data to employment_data
    if national_records:
        import_national_data(national_records)
    
    # Import state data to regional_employment
    if regional_records:
        import_regional_data(regional_records, national_records)
    
    # Clean invalid data
    clean_invalid_occupations()
    
    # Verify results
    verify_import()
    
    print("\nData import completed!")


# =====================================================
# Run script
# =====================================================

if __name__ == "__main__":
    main()
