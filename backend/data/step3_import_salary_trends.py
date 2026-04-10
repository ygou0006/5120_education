"""
Data cube 11 Salary Data Import Script
Import ABS 6306.0 salary data to salary_trends table
Only imports occupations that exist in occupations table
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
# Configuration parameters
# =====================================================
BASE_DIR = Path(__file__).parent / '6306'

# List of files to import (in chronological order)
FILES_TO_IMPORT = [
    '63060do011_201405.xls',  # year=2014
    '63060do011_201605.xls',  # year=2016
    '63060do011_201805.xls',  # year=2018
    '63060DO011_202105.xlsx', # year=2021
    '63060DO011_202305.xlsx', # year=2023
    '63060DO011_202505.xlsx', # year=2025
]

# =====================================================
# Parse Data cube 11
# =====================================================

def parse_data_cube_11(file_path):
    """
    Parse Data cube 11 Excel file
    Extract ANZSCO 4-digit occupation average weekly wage data
    """
    print(f"Parsing: {file_path}")
    
    try:
        # Read Excel file
        excel_file = pd.ExcelFile(file_path)
        
        # Read Table_1 worksheet
        df = pd.read_excel(file_path, sheet_name='Table_1', header=None)
        
        # Skip first 5 header rows, data starts from row 6
        df = df.iloc[5:].reset_index(drop=True)
        df.columns = ['occupation', 'males', 'females', 'persons', 'age_m', 'age_f', 'age_p']
        
        # Clean data - remove empty rows
        df = df[df['occupation'].notna()].reset_index(drop=True)
        
        # Extract year (from filename)
        year = extract_year_from_file(file_path)
        
        print(f"  Year: {year}, Data rows: {len(df)}")
        
        records = []
        for idx, row in df.iterrows():
            # Extract ANZSCO code (first 4 digits)
            anzsco_code = extract_anzsco_code_from_row(row, 0)
            if not anzsco_code:
                continue
            
            # Extract weekly wage data
            persons_weekly = extract_numeric_value(row, 3)  # persons column
            males_weekly = extract_numeric_value(row, 1)   # males column
            females_weekly = extract_numeric_value(row, 2) # females column
            
            if persons_weekly is None:
                continue
            
            # Convert weekly to annual salary
            annual_salary = int(persons_weekly * 52)
            
            # Calculate gender_pay_gap
            gender_pay_gap = None
            if males_weekly and females_weekly and males_weekly > 0:
                gender_pay_gap = round(((males_weekly - females_weekly) / males_weekly) * 100, 2)
            
            records.append({
                'anzsco_code': anzsco_code,
                'year': year,
                'average_annual_salary': annual_salary,
                'median_annual_salary': annual_salary,  # Use average as substitute
                'entry_level_salary': int(annual_salary * 0.8),  # 80%
                'senior_level_salary': int(annual_salary * 1.2),  # 120%
                'gender_pay_gap': gender_pay_gap,
                'salary_growth_rate': None,  # Calculate later
            })
        
        print(f"  Extracted {len(records)} salary records")
        return records
        
    except Exception as e:
        print(f"  Parse failed: {e}")
        return []


def extract_anzsco_code_from_row(row, code_col):
    """Extract ANZSCO code from row"""
    if code_col is None or code_col >= len(row):
        return None
    
    value = row.iloc[code_col] if hasattr(row, 'iloc') else row[code_col]
    
    if pd.isna(value):
        return None
    
    value_str = str(value).strip()
    
    # Match 4-digit ANZSCO code
    match = re.search(r'(\d{4})', value_str)
    if match:
        return match.group(1)
    
    return None

def extract_occupation_title(row, title_col):
    """Extract occupation title"""
    if title_col is None or title_col >= len(row):
        return None
    
    value = row.iloc[title_col] if hasattr(row, 'iloc') else row[title_col]
    
    if pd.isna(value):
        return None
    
    title = str(value).strip()
    
    # Remove ANZSCO code prefix (if exists)
    title = re.sub(r'^\d{4}\s+', '', title)
    
    return title

def extract_numeric_value(row, col):
    """Extract numeric value (handle various formats)"""
    if col is None or col >= len(row):
        return None
    
    value = row.iloc[col] if hasattr(row, 'iloc') else row[col]
    
    if pd.isna(value):
        return None
    
    try:
        # If string, remove $ and commas
        if isinstance(value, str):
            value = value.replace('$', '').replace(',', '').strip()
        
        numeric_value = float(value)
        
        # Sanity check: weekly wage should be between $200 - $5000
        if 200 <= numeric_value <= 5000:
            return numeric_value
        else:
            return None
            
    except (ValueError, TypeError):
        return None

def extract_year_from_file(file_path):
    """Extract year from filename"""
    import re
    # Extract year from sheet name
    try:
        df = pd.read_excel(file_path, sheet_name='Table_1', header=None)
        # Find row containing year
        for idx, row in df.iterrows():
            if idx < 5:
                row_str = str(row.iloc[0]).lower()
                match = re.search(r'(20\d{2})', row_str)
                if match:
                    return int(match.group(1))
    except:
        pass
    # Extract from filename
    match = re.search(r'20\d{2}', file_path)
    if match:
        year = int(match.group(0))
        if year in [2014, 2016, 2018, 2021, 2023, 2025]:
            return year
    return 2025


# =====================================================
# Get existing occupation mapping from occupations table
# =====================================================

def get_occupation_mapping(engine):
    """
    Get ANZSCO code to occupation_id mapping
    Only returns existing occupations, does not create new ones
    """
    mapping = {}
    with engine.connect() as conn:
        # Get all 6-digit and 4-digit codes
        result = conn.execute(text("SELECT id, anzsco_code FROM occupations WHERE is_active = TRUE"))
        for row in result:
            code = row[1]
            mapping[code] = row[0]  # 6-digit code mapping
            # Also store 4-digit version (take first 4 digits)
            if len(code) >= 4:
                mapping[code[:4]] = row[0]  # 4-digit code also maps to same occupation
    
    return mapping


# =====================================================
# Import data to database (only match existing occupations)
# =====================================================

def import_salary_data(records, occupation_map):
    """
    Import salary data to salary_trends table
    Only imports occupations that exist in occupations table
    """
    print("Importing salary data to salary_trends table...")
    print(f"  Occupations table has {len(set(occupation_map.values()))} occupations")
    print(f"  ANZSCO code mapping count: {len(occupation_map)}")
    
    engine = create_engine(database_url)
    
    inserted_count = 0
    updated_count = 0
    skipped_count = 0
    not_found_count = 0
    not_found_codes = set()
    
    with engine.connect() as conn:
        for i, record in enumerate(records):
            if (i + 1) % 50 == 0:
                print(f"    Progress: {i + 1}/{len(records)} (matched: {inserted_count + updated_count}, not matched: {not_found_count})")
            
            # Find occupation ID (only match existing occupations, do not create new ones)
            occupation_id = occupation_map.get(record['anzsco_code'])
            
            if occupation_id is None:
                # Record occupation code not found
                not_found_count += 1
                not_found_codes.add(record['anzsco_code'])
                continue
            
            try:
                # Check if data for this year already exists
                existing = conn.execute(
                    text("""
                        SELECT id FROM salary_trends 
                        WHERE occupation_id = :occ_id AND year = :year
                    """),
                    {
                        "occ_id": occupation_id,
                        "year": record['year']
                    }
                ).fetchone()
                
                if existing is None:
                    # Insert new record
                    conn.execute(
                        text("""
                            INSERT INTO salary_trends 
                            (occupation_id, year, average_annual_salary, median_annual_salary,
                             entry_level_salary, senior_level_salary, gender_pay_gap, salary_growth_rate, created_at)
                            VALUES (:occ_id, :year, :avg_salary, :median_salary, :entry_salary, :senior_salary, :gender_gap, :growth_rate, NOW())
                        """),
                        {
                            "occ_id": occupation_id,
                            "year": record['year'],
                            "avg_salary": record['average_annual_salary'],
                            "median_salary": record['median_annual_salary'],
                            "entry_salary": record['entry_level_salary'],
                            "senior_salary": record['senior_level_salary'],
                            "gender_gap": record.get('gender_pay_gap'),
                            "growth_rate": record.get('salary_growth_rate')
                        }
                    )
                    inserted_count += 1
                else:
                    # Update existing record
                    conn.execute(
                        text("""
                            UPDATE salary_trends 
                            SET average_annual_salary = :avg_salary,
                                median_annual_salary = :median_salary,
                                entry_level_salary = :entry_salary,
                                senior_level_salary = :senior_salary,
                                gender_pay_gap = :gender_gap,
                                salary_growth_rate = :growth_rate
                            WHERE occupation_id = :occ_id AND year = :year
                        """),
                        {
                            "occ_id": occupation_id,
                            "year": record['year'],
                            "avg_salary": record['average_annual_salary'],
                            "median_salary": record['median_annual_salary'],
                            "entry_salary": record['entry_level_salary'],
                            "senior_salary": record['senior_level_salary'],
                            "gender_gap": record.get('gender_pay_gap'),
                            "growth_rate": record.get('salary_growth_rate')
                        }
                    )
                    updated_count += 1
                
                # Commit every 100 records
                if (inserted_count + updated_count) % 100 == 0:
                    conn.commit()
                    
            except Exception as e:
                print(f"    Error: {record['anzsco_code']} - {record['year']}: {e}")
                skipped_count += 1
        
        conn.commit()
    
    # Print unmatched occupation codes
    if not_found_codes:
        print(f"\n  Warning: The following {len(not_found_codes)} ANZSCO codes do not exist in occupations table, skipped:")
        for code in sorted(list(not_found_codes))[:20]:  # Show only first 20
            print(f"    - {code}")
        if len(not_found_codes) > 20:
            print(f"    ... and {len(not_found_codes) - 20} more")
    
    print(f"\n  Import completed: Inserted {inserted_count} records, Updated {updated_count} records, Skipped {skipped_count} records, Not matched {not_found_count} records\n")
    return inserted_count + updated_count


# =====================================================
# Verify import results
# =====================================================

def verify_salary_import():
    """Verify salary data import results"""
    print("\n" + "=" * 60)
    print("Verifying salary data import results")
    print("=" * 60)
    
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        # Count salary data
        result = conn.execute(text("SELECT COUNT(*) FROM salary_trends"))
        salary_total = result.fetchone()[0]
        print(f"salary_trends total records: {salary_total}")
        
        # Count occupations with salary data
        result = conn.execute(text("SELECT COUNT(DISTINCT occupation_id) FROM salary_trends"))
        occ_count = result.fetchone()[0]
        print(f"Occupations with salary data: {occ_count}")
        
        # Year range
        result = conn.execute(text("SELECT MIN(year), MAX(year) FROM salary_trends"))
        min_year, max_year = result.fetchone()
        print(f"Year range: {min_year} - {max_year}")
        
        # Show sample
        print("\nSalary data sample:")
        result = conn.execute(text("""
            SELECT o.anzsco_code, o.title, s.year, s.average_annual_salary, s.gender_pay_gap
            FROM salary_trends s
            JOIN occupations o ON s.occupation_id = o.id
            WHERE s.average_annual_salary IS NOT NULL
            ORDER BY s.average_annual_salary DESC
            LIMIT 10
        """))
        
        for row in result:
            gap_info = f", Gender gap: {row[4]}%" if row[4] else ""
            print(f"    {row[0]} - {row[1][:40]}: {row[2]} year, ${row[3]:,}{gap_info}")
        
        # Count occupations without salary data
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM occupations o
            LEFT JOIN salary_trends s ON o.id = s.occupation_id
            WHERE s.id IS NULL
        """))
        missing_occ = result.fetchone()[0]
        print(f"\nOccupations without salary data: {missing_occ}")
    
    print("=" * 60)


# =====================================================
# Calculate salary_growth_rate
# =====================================================

def calculate_growth_rate(engine):
    """Calculate and update salary_growth_rate"""
    print("\nCalculating salary growth rate...")
    
    with engine.connect() as conn:
        # Get all salary data by year and occupation
        result = conn.execute(text("""
            SELECT occupation_id, year, average_annual_salary 
            FROM salary_trends 
            WHERE average_annual_salary IS NOT NULL
            ORDER BY occupation_id, year
        """))
        
        salary_data = {}
        for row in result:
            occ_id, year, salary = row
            if occ_id not in salary_data:
                salary_data[occ_id] = {}
            salary_data[occ_id][year] = salary
        
        # Sort years for finding previous year
        all_years = sorted(set([2014, 2016, 2018, 2021, 2023, 2025]))
        
        update_count = 0
        for occ_id, year_salaries in salary_data.items():
            for year, salary in year_salaries.items():
                # Find previous year's data
                prev_year = None
                for y in all_years:
                    if y < year and y in year_salaries:
                        prev_year = y
                        break
                
                if prev_year and year_salaries[prev_year]:
                    prev_salary = year_salaries[prev_year]
                    if prev_salary > 0:
                        growth_rate = round(((salary - prev_salary) / prev_salary) * 100, 2)
                        conn.execute(
                            text("""
                                UPDATE salary_trends 
                                SET salary_growth_rate = :rate
                                WHERE occupation_id = :occ_id AND year = :year
                            """),
                            {"rate": growth_rate, "occ_id": occ_id, "year": year}
                        )
                        update_count += 1
        
        conn.commit()
        print(f"  Updated {update_count} salary growth rate records")


# =====================================================
# Verify import results

def supplement_6digit_codes(engine, records):
    """
    If data file has 4-digit code but occupations table has 6-digit code,
    try to supplement 4-digit to 6-digit (use first matching occupation)
    """
    # Get all 6-digit code occupations
    six_digit_mapping = {}
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, anzsco_code FROM occupations WHERE LENGTH(anzsco_code) = 6"))
        for row in result:
            code_4digit = row[1][:4]  # Take first 4 digits
            if code_4digit not in six_digit_mapping:
                six_digit_mapping[code_4digit] = []
            six_digit_mapping[code_4digit].append((row[0], row[1]))
    
    # Extend mapping
    extended_map = {}
    for code_4digit, occupations in six_digit_mapping.items():
        if len(occupations) == 1:
            # Only one match, map directly
            extended_map[code_4digit] = occupations[0][0]
        else:
            # Multiple matches, log warning but do not auto-map
            print(f"  Warning: 4-digit code {code_4digit} matches multiple 6-digit occupations: {[occ[1] for occ in occupations]}")
    
    return extended_map


# =====================================================
# Main function
# =====================================================

def main():
    """Main function"""
    print("=" * 60)
    print("Salary Data Import Script (Data cube 11)")
    print("Only imports occupations that exist in occupations table")
    print("=" * 60)
    print()
    
    # Test database connection
    try:
        engine = create_engine(database_url)
        conn = engine.connect()
        print("Database connection successful\n")
        conn.close()
    except Exception as e:
        print(f"Database connection failed: {e}")
        print("Please check database configuration")
        return
    
    # Get existing occupation mapping
    occupation_map = get_occupation_mapping(engine)
    print(f"Retrieved {len(occupation_map)} ANZSCO code mappings from occupations table\n")
    
    # Process files in chronological order
    all_records = []
    years_processed = []
    
    for filename in FILES_TO_IMPORT:
        file_path = BASE_DIR / filename
        if not file_path.exists():
            print(f"File does not exist, skip: {file_path}")
            continue
        
        records = parse_data_cube_11(str(file_path))
        if records:
            all_records.extend(records)
            years_processed.append(records[0]['year'] if records else None)
    
    if not all_records:
        print("No valid salary data found")
        return
    
    print(f"\nExtracted {len(all_records)} salary records")
    print(f"Years: {sorted(set(r['year'] for r in all_records))}")
    
    # Sort by year (for calculating growth rate)
    all_records.sort(key=lambda x: x['year'])
    
    # Import data (only match existing occupations)
    import_salary_data(all_records, occupation_map)
    
    # Calculate and update salary_growth_rate
    calculate_growth_rate(engine)
    
    # Verify results
    verify_salary_import()
    
    print("\nSalary data import completed!")


# =====================================================
# Run script
# =====================================================

if __name__ == "__main__":
    main()
