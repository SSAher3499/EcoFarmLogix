#!/usr/bin/env python3
"""
Simple startup script for the gateway
"""
import os
import sys

# Change to script directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Ensure logs directory exists
os.makedirs('logs', exist_ok=True)

# Run main application
from src.main import main
main()