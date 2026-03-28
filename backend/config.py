import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-change-me")

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///" + os.path.join(BASE_DIR, "memoretos.db"),
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:5500,http://localhost:5500,http://localhost:3000",
    ).split(",")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config = {
    "development": DevelopmentConfig,
    "production":  ProductionConfig,
    "default":     DevelopmentConfig,
}
