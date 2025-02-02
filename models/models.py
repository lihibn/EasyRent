<!--EasyRent - 20251W87 -->


# Import necessary modules and libraries for database table definitions and relationships.
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum, DateTime, Text, Date, Time, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.db import Base
from enum import Enum as PyEnum
from werkzeug.security import generate_password_hash, check_password_hash
import enum
import bcrypt
import datetime

# Defines the roles a user can have in the system.
class UserRole(enum.Enum):
    landlord = "Landlord"
    tenant = "Tenant"
    developer = "Developer"

# Represents the users of the system with attributes like name, email, password, role, etc.
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(200), nullable=False)
    role = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    last_login = Column(DateTime, nullable=True)
    
    # Relationship to FaultReport table.
    fault_reports = relationship('FaultReport', back_populates='user')

    # Sets a hashed password using Werkzeug.
    def set_password(self, password):
        self.password = generate_password_hash(password)

    # Checks if the provided password matches the stored hash
    def check_password(self, password):
        return check_password_hash(self.password, password)

    # Debugging representation for user instances
    def __repr__(self):
        return f"<User(id={self.id}, full_name='{self.full_name}', email='{self.email}', role='{self.role}')>"

# Represents reports related to property faults, submitted by users.
class FaultReport(Base):
    __tablename__ = 'fault_reports'
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey('properties.id'), nullable=False)
    professional_name = Column(String, nullable=False)
    fault_description = Column(String, nullable=False)
    fault_details = Column(Text, nullable=False)
    fault_image = Column(String, nullable=True)
    status = Column(String, default="Pending")
    professional_rating = Column(Integer, nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    property = relationship('Property', back_populates='fault_reports')
    user = relationship('User', back_populates='fault_reports')


# Represents properties in the system with details like address, type, rent, etc.
class Property(Base):
    __tablename__ = 'properties'
    id = Column(Integer, primary_key=True, autoincrement=True)
    property_name = Column(String(100), nullable=False)  #
    city = Column(String(50), nullable=False)
    street = Column(String(100), nullable=False)
    house_number = Column(String(10), nullable=False)
    entrance = Column(String(50), nullable=False)
    floor = Column(Integer, nullable=False)
    property_type = Column(Enum("apartment", "house", "studio", "villa", name="property_type_enum"), nullable=False)
    airflow = Column(Enum("north", "south", "east", "west", name="airflow_enum"), nullable=False)
    rooms = Column(Float, nullable=False)
    square_meters = Column(Float, nullable=False)
    property_photos = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    monthly_rent = Column(Float, nullable=False)
    building_maintenance = Column(Float, nullable=False)
    entry_date = Column(Date, nullable=True)
    contract_path = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey('users.id'))
    owner = relationship('User', backref='properties')
    meeting_slots = relationship('Meeting', back_populates='property')
    fault_reports = relationship('FaultReport', back_populates='property')

# Represents meeting slots for property viewings or discussions.
class Meeting(Base):
    __tablename__ = 'meeting_slots'
    id = Column(Integer, primary_key=True, autoincrement=True)
    property_id = Column(Integer, ForeignKey('properties.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=False)
    attendee = Column(String(100), nullable=True)
    is_available = Column(Boolean, default=True)
    property = relationship('Property', back_populates='meeting_slots')
    meet_owner = relationship('User', backref='meetings')

# Represents payments made for properties.
class Payment(Base):
    __tablename__ = 'payments'
    id = Column(Integer, primary_key=True)
    amount = Column(Float, nullable=False)
    status = Column(String(50), nullable=False)
    date = Column(Date, nullable=False)
    tenant_id = Column(Integer, ForeignKey('users.id'))
    tenant = relationship('User', backref='payments')
    property_id = Column(Integer, ForeignKey('properties.id'))
    property = relationship('Property', backref='payments')

# Represents contracts signed for properties.
class Contract(Base):
    __tablename__ = 'contracts'
    id = Column(Integer, primary_key=True)
    file_url = Column(String(200), nullable=False)
    status = Column(String, nullable=False)
    tenant_signed = Column(Boolean, default=False)
    date_uploaded = Column(DateTime, default=datetime.datetime.utcnow())
    property_id = Column(Integer, ForeignKey('properties.id'))
    tenant_id = Column(Integer, ForeignKey('users.id'))
    is_deleted = Column(Boolean, default=False)
    property = relationship('Property', backref='contracts')
    tenant = relationship('User', foreign_keys=[tenant_id], backref='tenant_contracts')

    # Debugging representation for contract instances.
    def __repr__(self):
        return f"<Contract(id={self.id}, status='{self.status}', file_url='{self.file_url}', tenant_id={self.tenant_id}, landlord_id={self.landlord_id})>"
