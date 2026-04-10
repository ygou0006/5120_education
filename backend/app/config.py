import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    database_url = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/career_explorer")
    secret_key = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    algorithm = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
    refresh_token_expire_minutes = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", "43200"))


settings = Config()
