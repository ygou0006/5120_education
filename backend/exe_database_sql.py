#!/usr/bin/env python3
"""
Database import script for Career Explorer
使用提供的DATABASE_URL将数据库脚本导入到远程MySQL数据库
"""

import re
import sys
from pathlib import Path

import pymysql
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError


# 数据库连接配置
DATABASE_URL = "mysql+pymysql://hellool003:Td0dit7nrfCkhpYT@hellool003.mysql.pythonanywhere-services.com:3306/hellool003$career_explorer"

# 数据库脚本文件路径（假设与当前脚本在同一目录）
SQL_FILE = Path(__file__).parent / "database.sql"


def parse_sql_file(sql_file_path: Path) -> list[str]:
    """
    解析SQL文件，将其分割成独立的SQL语句
    
    Args:
        sql_file_path: SQL文件路径
        
    Returns:
        SQL语句列表
    """
    with open(sql_file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 移除注释
    # 移除单行注释 --
    content = re.sub(r"--[^\n]*\n", "\n", content)
    # 移除多行注释 /* ... */
    content = re.sub(r"/\*.*?\*/", "", content, flags=re.DOTALL)
    
    # 按分号分割SQL语句
    statements = []
    current_statement = []
    
    for line in content.split("\n"):
        line = line.strip()
        if not line:
            continue
            
        current_statement.append(line)
        
        # 如果当前行以分号结尾，表示一条语句结束
        if line.endswith(";"):
            statement = " ".join(current_statement)
            # 移除末尾的分号
            statement = statement.rstrip(";")
            if statement:
                statements.append(statement)
            current_statement = []
    
    # 处理最后可能没有分号的语句
    if current_statement:
        statement = " ".join(current_statement)
        if statement:
            statements.append(statement)
    
    return statements


def execute_statement(engine, statement: str, statement_num: int, total: int) -> bool:
    """
    执行单条SQL语句
    
    Args:
        engine: SQLAlchemy引擎
        statement: SQL语句
        statement_num: 当前语句编号
        total: 总语句数
        
    Returns:
        是否执行成功
    """
    try:
        with engine.connect() as conn:
            # 对于CREATE DATABASE语句需要特殊处理（如果数据库不存在）
            if statement.strip().upper().startswith("CREATE DATABASE"):
                # 提取数据库名并检查是否存在
                match = re.search(r"CREATE DATABASE IF NOT EXISTS\s+(\w+)", statement, re.IGNORECASE)
                if match:
                    db_name = match.group(1)
                    # 检查数据库是否存在
                    result = conn.execute(text(f"SHOW DATABASES LIKE '{db_name}'"))
                    if result.fetchone():
                        print(f"  ⏭️  数据库 '{db_name}' 已存在，跳过创建")
                        return True
                    else:
                        conn.execute(text(statement))
                        conn.commit()
                        print(f"  ✅ 创建数据库 '{db_name}'")
                else:
                    conn.execute(text(statement))
                    conn.commit()
            else:
                conn.execute(text(statement))
                conn.commit()
        
        print(f"  ✅ [{statement_num}/{total}] 执行成功")
        return True
        
    except SQLAlchemyError as e:
        error_msg = str(e)
        # 忽略一些常见的重复创建错误
        if "already exists" in error_msg.lower():
            print(f"  ⏭️  [{statement_num}/{total}] 表已存在，跳过")
            return True
        elif "Duplicate entry" in error_msg:
            print(f"  ⚠️  [{statement_num}/{total}] 数据已存在，跳过: {error_msg[:100]}")
            return True
        else:
            print(f"  ❌ [{statement_num}/{total}] 执行失败: {error_msg[:200]}")
            return False


def test_connection(engine):
    """测试数据库连接"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT VERSION()"))
            version = result.fetchone()[0]
            print(f"✅ 数据库连接成功！MySQL版本: {version}")
            return True
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        return False


def check_database_exists(engine, db_name: str) -> bool:
    """检查数据库是否存在"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(f"SHOW DATABASES LIKE '{db_name}'"))
            return result.fetchone() is not None
    except Exception:
        return False


def main():
    """主函数"""
    print("=" * 60)
    print("Career Explorer - 数据库导入工具")
    print("=" * 60)
    
    # 检查SQL文件是否存在
    if not SQL_FILE.exists():
        print(f"❌ 找不到SQL文件: {SQL_FILE}")
        print(f"   请确保 '{SQL_FILE.name}' 文件与当前脚本在同一目录")
        sys.exit(1)
    
    # 创建数据库引擎
    print(f"\n📁 连接到数据库服务器...")
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,  # 连接前测试连接是否有效
    )
    
    # 测试连接
    if not test_connection(engine):
        print("\n请检查:")
        print("  1. 数据库服务器是否可访问")
        print("  2. 用户名和密码是否正确")
        print("  3. 端口号是否正确 (3311)")
        sys.exit(1)
    
    # 解析SQL文件
    print(f"\n📖 解析SQL文件: {SQL_FILE.name}")
    statements = parse_sql_file(SQL_FILE)
    print(f"   共解析出 {len(statements)} 条SQL语句")
    
    # 执行SQL语句
    print(f"\n🚀 开始执行SQL语句...")
    print("-" * 40)
    
    success_count = 0
    fail_count = 0
    
    for i, statement in enumerate(statements, 1):
        # 跳过USE语句，因为我们已经在URL中指定了数据库
        if statement.strip().upper().startswith("USE "):
            print(f"  ⏭️  [{i}/{len(statements)}] 跳过USE语句（已在连接URL中指定数据库）")
            success_count += 1
            continue
        
        # 跳过CREATE DATABASE语句，如果数据库已存在
        if statement.strip().upper().startswith("CREATE DATABASE"):
            # 提取数据库名
            match = re.search(r"CREATE DATABASE IF NOT EXISTS\s+(\w+)", statement, re.IGNORECASE)
            if match:
                db_name = match.group(1)
                if check_database_exists(engine, db_name):
                    print(f"  ⏭️  [{i}/{len(statements)}] 数据库 '{db_name}' 已存在，跳过")
                    success_count += 1
                    continue
        
        if execute_statement(engine, statement, i, len(statements)):
            success_count += 1
        else:
            fail_count += 1
            # 对于非关键错误继续执行
            if "Access denied" in statement.lower():
                print("  ⚠️  权限不足，跳过该语句")
                success_count += 1
                fail_count -= 1
    
    # 输出结果
    print("-" * 40)
    print(f"\n📊 执行结果统计:")
    print(f"   ✅ 成功: {success_count}")
    print(f"   ❌ 失败: {fail_count}")
    print(f"   📝 总计: {len(statements)}")
    
    if fail_count == 0:
        print("\n🎉 数据库导入成功完成！")
        
        # 验证数据
        print("\n🔍 验证导入的数据...")
        try:
            with engine.connect() as conn:
                # 检查各个表的数据量
                tables = ["courses", "interest_tags", "occupations", "users"]
                for table in tables:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.fetchone()[0]
                    print(f"   📋 {table}: {count} 条记录")
        except Exception as e:
            print(f"   ⚠️  验证时出错: {e}")
    else:
        print(f"\n⚠️  有 {fail_count} 条语句执行失败，请检查上述错误信息")
        print("   大部分错误可能是由于表或数据已存在，可以忽略")
    
    print("\n✨ 导入完成！")


if __name__ == "__main__":
    main()