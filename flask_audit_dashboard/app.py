#!/usr/bin/env python3
"""
ICSF GAMA Audit Dashboard

This Flask application provides a web interface for reviewing ICSF GAMA
audit logs and compliance reports. It's designed for county assessment
professionals and administrators to monitor system usage and ensure
proper compliance with policies.

Features:
1. Audit log viewing with filtering and search
2. Risk assessment analysis with charts
3. Summary statistics and reports
4. User activity monitoring
"""

import os
import re
import json
import time
import logging
import datetime
from collections import defaultdict, Counter
from typing import Dict, List, Any, Optional, Tuple

from flask import (
    Flask, render_template, request, redirect, url_for, 
    session, flash, jsonify, send_file, abort
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler('logs/dashboard.log'), logging.StreamHandler()]
)
logger = logging.getLogger('icsf_dashboard')

# Constants
LOG_PATH = 'logs/compliance_audit.log'
OUTPUT_PATH = 'reports'
REPORT_RETENTION_DAYS = 30
DASHBOARD_VERSION = '1.0.0'

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get('DASHBOARD_SECRET_KEY', 'icsf-gama-dashboard-dev-key')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['TEMPLATES_AUTO_RELOAD'] = True


def parse_log_entry(line: str) -> Dict[str, Any]:
    """Parse a log entry into components"""
    pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) - (\w+) - (\w+) - (.+)'
    match = re.match(pattern, line)
    
    if not match:
        return None
    
    timestamp_str, system, level, message = match.groups()
    timestamp = datetime.datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S,%f')
    
    entry = {
        'timestamp': timestamp,
        'timestamp_str': timestamp_str,
        'system': system,
        'level': level,
        'message': message,
    }
    
    # Assign risk level based on content analysis
    entry['risk'] = classify_risk_level(entry)
    
    # Assign category based on content analysis
    entry['category'] = classify_category(entry)
    
    return entry


def classify_risk_level(entry: Dict[str, Any]) -> str:
    """Classify the risk level of a log entry"""
    level = entry['level']
    message = entry['message'].lower()
    
    # Critical risk indicators
    if 'unauthorized access' in message:
        return 'HIGH'
    
    if 'security breach' in message or 'injection attempt' in message:
        return 'CRITICAL'
    
    # High risk indicators
    if level == 'ERROR':
        return 'HIGH'
    
    if 'exceed' in message and 'threshold' in message:
        return 'MEDIUM'
    
    if 'extreme' in message and 'fluctuation' in message:
        return 'MEDIUM'
    
    if 'integrity check failed' in message:
        return 'MEDIUM'
    
    # Medium risk indicators
    if level == 'WARNING':
        return 'MEDIUM'
    
    if 'manual override' in message:
        return 'MEDIUM'
    
    # Everything else is low risk
    return 'LOW'


def classify_category(entry: Dict[str, Any]) -> str:
    """Classify the category of a log entry"""
    message = entry['message'].lower()
    
    categories = {
        'ACCESS': ['access', 'user', 'login', 'logout', 'unauthorized'],
        'CONFIGURATION': ['configuration', 'parameter', 'changed', 'setting'],
        'SIMULATION': ['simulation', 'started', 'completed', 'properties', 'neighborhoods'],
        'DATA': ['property', 'valuation', 'neighborhood', 'generated', 'output saved'],
        'SYSTEM': ['started', 'shutting down', 'disk space', 'integrity check'],
        'COMPLIANCE': ['compliance', 'policy', 'audit', 'override']
    }
    
    for category, keywords in categories.items():
        if any(keyword in message for keyword in keywords):
            return category
    
    return 'OTHER'


def load_log_entries(
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    risk_level: Optional[str] = None,
    category: Optional[str] = None,
    max_entries: int = 1000
) -> List[Dict[str, Any]]:
    """Load and filter log entries"""
    entries = []
    
    try:
        with open(LOG_PATH, 'r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                
                entry = parse_log_entry(line)
                if not entry:
                    continue
                
                # Apply date filters
                if start_date and entry['timestamp'].date() < start_date:
                    continue
                if end_date and entry['timestamp'].date() > end_date:
                    continue
                
                # Apply risk level filter
                if risk_level and entry['risk'] != risk_level:
                    continue
                
                # Apply category filter
                if category and entry['category'] != category:
                    continue
                
                entries.append(entry)
                
                # Limit to max entries
                if len(entries) >= max_entries:
                    break
    except Exception as e:
        logger.error(f"Error loading log entries: {e}")
    
    # Sort by timestamp (newest first)
    entries.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return entries


def generate_summary_stats(entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate summary statistics from log entries"""
    if not entries:
        return {
            'total_entries': 0,
            'risk_counts': {},
            'category_counts': {},
            'level_counts': {},
            'high_risk_count': 0,
            'categories': [],
            'risk_levels': [],
            'log_levels': []
        }
    
    # Count by risk level
    risk_counts = Counter(entry['risk'] for entry in entries)
    
    # Count by category
    category_counts = Counter(entry['category'] for entry in entries)
    
    # Count by log level
    level_counts = Counter(entry['level'] for entry in entries)
    
    # Count high risk entries
    high_risk_count = sum(1 for entry in entries if entry['risk'] in ['HIGH', 'CRITICAL'])
    
    return {
        'total_entries': len(entries),
        'risk_counts': dict(risk_counts),
        'category_counts': dict(category_counts),
        'level_counts': dict(level_counts),
        'high_risk_count': high_risk_count,
        'categories': sorted(category_counts.keys()),
        'risk_levels': sorted(risk_counts.keys()),
        'log_levels': sorted(level_counts.keys())
    }


@app.route('/')
def index():
    """Dashboard home page"""
    try:
        # Get recent entries
        recent_entries = load_log_entries(max_entries=10)
        summary = generate_summary_stats(load_log_entries(max_entries=1000))
        
        # Generate stats for today
        today = datetime.date.today()
        today_entries = load_log_entries(start_date=today, end_date=today)
        today_summary = generate_summary_stats(today_entries)
        
        return render_template(
            'index.html',
            recent_entries=recent_entries,
            summary=summary,
            today_summary=today_summary,
            version=DASHBOARD_VERSION
        )
    except Exception as e:
        logger.error(f"Error rendering index: {e}")
        return render_template('error.html', error=str(e))


@app.route('/logs')
def view_logs():
    """View filtered log entries"""
    try:
        # Parse filters
        filters = {
            'start_date': request.args.get('start_date', ''),
            'end_date': request.args.get('end_date', ''),
            'risk_level': request.args.get('risk_level', ''),
            'category': request.args.get('category', ''),
            'max_entries': int(request.args.get('max_entries', 100))
        }
        
        # Convert date strings to datetime.date objects
        start_date = None
        if filters['start_date']:
            try:
                start_date = datetime.datetime.strptime(filters['start_date'], '%Y-%m-%d').date()
            except ValueError:
                pass
        
        end_date = None
        if filters['end_date']:
            try:
                end_date = datetime.datetime.strptime(filters['end_date'], '%Y-%m-%d').date()
            except ValueError:
                pass
        
        # Load filtered entries
        entries = load_log_entries(
            start_date=start_date,
            end_date=end_date,
            risk_level=filters['risk_level'] or None,
            category=filters['category'] or None,
            max_entries=filters['max_entries']
        )
        
        # Generate summary statistics
        summary = generate_summary_stats(entries)
        
        # Get all possible filter options
        all_entries = load_log_entries(max_entries=1000)
        all_summary = generate_summary_stats(all_entries)
        
        risk_levels = all_summary['risk_levels']
        categories = all_summary['categories']
        
        return render_template(
            'logs.html',
            entries=entries,
            summary=summary,
            filters=filters,
            risk_levels=risk_levels,
            categories=categories
        )
    except Exception as e:
        logger.error(f"Error viewing logs: {e}")
        return render_template('error.html', error=str(e))


@app.route('/dashboard')
def dashboard():
    """Analytics dashboard with charts and visualizations"""
    try:
        # Load entries for the last 30 days
        end_date = datetime.date.today()
        start_date = end_date - datetime.timedelta(days=30)
        
        entries = load_log_entries(
            start_date=start_date,
            end_date=end_date,
            max_entries=5000
        )
        
        # Generate summary stats
        summary = generate_summary_stats(entries)
        
        # Generate data for time series chart
        daily_counts = defaultdict(int)
        daily_risk_counts = defaultdict(lambda: defaultdict(int))
        
        for entry in entries:
            date_str = entry['timestamp'].strftime('%Y-%m-%d')
            daily_counts[date_str] += 1
            daily_risk_counts[date_str][entry['risk']] += 1
        
        # Sort by date
        dates = sorted(daily_counts.keys())
        
        # Prepare chart data
        chart_data = {
            'dates': dates,
            'counts': [daily_counts[date] for date in dates],
            'risk_data': {
                'LOW': [daily_risk_counts[date]['LOW'] for date in dates],
                'MEDIUM': [daily_risk_counts[date]['MEDIUM'] for date in dates],
                'HIGH': [daily_risk_counts[date]['HIGH'] for date in dates],
                'CRITICAL': [daily_risk_counts[date]['CRITICAL'] for date in dates],
            }
        }
        
        return render_template(
            'dashboard.html',
            summary=summary,
            chart_data=json.dumps(chart_data)
        )
    except Exception as e:
        logger.error(f"Error rendering dashboard: {e}")
        return render_template('error.html', error=str(e))


@app.route('/api/summary')
def api_summary():
    """API endpoint for summary statistics"""
    try:
        # Load entries
        entries = load_log_entries(max_entries=1000)
        summary = generate_summary_stats(entries)
        
        return jsonify({
            'status': 'success',
            'data': summary
        })
    except Exception as e:
        logger.error(f"API error: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/reports')
def view_reports():
    """View generated reports"""
    try:
        reports = []
        
        # List all files in the reports directory
        if os.path.exists(OUTPUT_PATH):
            for filename in os.listdir(OUTPUT_PATH):
                if filename.endswith('.pdf') or filename.endswith('.html') or filename.endswith('.csv'):
                    file_path = os.path.join(OUTPUT_PATH, filename)
                    file_stats = os.stat(file_path)
                    
                    # Get file creation time
                    created = datetime.datetime.fromtimestamp(file_stats.st_ctime)
                    
                    reports.append({
                        'filename': filename,
                        'created': created,
                        'size': file_stats.st_size,
                        'path': file_path
                    })
            
            # Sort by creation time (newest first)
            reports.sort(key=lambda x: x['created'], reverse=True)
        
        # Calculate next report dates
        now = datetime.datetime.now()
        day_delta = datetime.timedelta(days=1)
        week_delta = datetime.timedelta(days=7)
        month_delta = datetime.timedelta(days=30)
        quarter_delta = datetime.timedelta(days=90)
        
        return render_template(
            'reports.html', 
            reports=reports,
            now=now,
            day_delta=day_delta,
            week_delta=week_delta,
            month_delta=month_delta,
            quarter_delta=quarter_delta
        )
    except Exception as e:
        logger.error(f"Error viewing reports: {e}")
        return render_template('error.html', error=str(e))


@app.route('/download/<path:filename>')
def download_report(filename):
    """Download a report file"""
    try:
        file_path = os.path.join(OUTPUT_PATH, filename)
        
        if not os.path.exists(file_path):
            abort(404)
        
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        logger.error(f"Error downloading report: {e}")
        return render_template('error.html', error=str(e))


@app.route('/health')
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'healthy',
        'version': DASHBOARD_VERSION,
        'timestamp': datetime.datetime.now().isoformat()
    })


@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors"""
    return render_template('error.html', error='Page not found'), 404


@app.errorhandler(500)
def server_error(e):
    """Handle 500 errors"""
    logger.error(f"Server error: {e}")
    return render_template('error.html', error='Internal server error'), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting ICSF GAMA Audit Dashboard on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)