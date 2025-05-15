#!/usr/bin/env python3
"""
ICSF GAMA Audit Dashboard

A Flask-based web dashboard for viewing and analyzing ICSF GAMA audit logs.
This dashboard provides a secure, user-friendly interface for compliance
officers and administrators to monitor system usage.

Features:
- View and filter audit logs
- Visualize audit data and trends
- Generate compliance reports
- Track high-risk activities
- Export data for further analysis
"""

import os
import re
import sys
import json
import logging
import datetime
from pathlib import Path
from collections import Counter, defaultdict

from flask import (
    Flask, render_template, request, jsonify, 
    send_from_directory, abort, redirect, url_for
)

# Import the audit AI review functions for analysis
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from audit_ai_review import (
        analyze_log_file, parse_log_entry, 
        classify_log_entry, RISK_LEVELS
    )
except ImportError:
    # Fallback implementations if audit_ai_review.py is not available
    logging.warning("audit_ai_review module not found, using fallback implementations")
    
    RISK_LEVELS = {
        "LOW": 1,
        "MEDIUM": 2,
        "HIGH": 3,
        "CRITICAL": 4
    }
    
    def parse_log_entry(line):
        parts = line.split(" - ", 3)
        if len(parts) < 4:
            return None
        
        try:
            timestamp_str = parts[0].strip()
            module = parts[1].strip()
            level = parts[2].strip()
            message = parts[3].strip()
            
            timestamp = datetime.datetime.strptime(
                timestamp_str, 
                "%Y-%m-%d %H:%M:%S,%f"
            )
            
            return {
                "timestamp": timestamp,
                "module": module,
                "level": level,
                "message": message,
                "raw": line
            }
        except Exception as e:
            logging.debug(f"Error parsing log entry: {e}")
            return None
    
    def classify_log_entry(entry):
        if not entry or "message" not in entry:
            return None
        
        # Simplified classification
        classification = {
            "category": "GENERAL",
            "risk": "LOW",
            "risk_level": RISK_LEVELS["LOW"]
        }
        
        if entry["level"] == "ERROR":
            classification["risk"] = "HIGH"
            classification["risk_level"] = RISK_LEVELS["HIGH"]
        elif entry["level"] == "WARNING":
            classification["risk"] = "MEDIUM"
            classification["risk_level"] = RISK_LEVELS["MEDIUM"]
        
        return {**entry, **classification}
    
    def analyze_log_file(log_file=None, start_date=None, end_date=None):
        # Simplified analysis for fallback
        return None

# Setup paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
LOG_DIR = os.path.join(ROOT_DIR, "logs")
COMPLIANCE_LOG = os.path.join(LOG_DIR, "compliance_audit.log")
REPORTS_DIR = os.path.join(ROOT_DIR, "reports")

# Ensure directories exist
for directory in [LOG_DIR, REPORTS_DIR]:
    os.makedirs(directory, exist_ok=True)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(LOG_DIR, "flask_dashboard.log")),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("ICSF_DASHBOARD")

# Initialize Flask app
app = Flask(__name__)
app.config["SECRET_KEY"] = os.urandom(24)  # Generate random secret key
app.config["REPORTS_DIR"] = REPORTS_DIR
app.config["LOG_DIR"] = LOG_DIR


# Helper functions
def get_log_entries(log_file=None, start_date=None, end_date=None, 
                   max_entries=1000, risk_level=None, category=None):
    """Get log entries with optional filtering"""
    file_path = log_file or COMPLIANCE_LOG
    
    if not os.path.exists(file_path):
        logger.error(f"Log file not found: {file_path}")
        return []
    
    try:
        entries = []
        with open(file_path, "r") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                
                entry = parse_log_entry(line)
                if not entry:
                    continue
                
                # Apply date filters if specified
                if start_date and entry["timestamp"] < start_date:
                    continue
                if end_date and entry["timestamp"] > end_date:
                    continue
                
                # Classify entry
                classified_entry = classify_log_entry(entry)
                if not classified_entry:
                    continue
                
                # Apply risk level filter if specified
                if risk_level and classified_entry["risk"] != risk_level:
                    continue
                
                # Apply category filter if specified
                if category and classified_entry["category"] != category:
                    continue
                
                entries.append(classified_entry)
                
                # Limit to max entries to avoid memory issues
                if len(entries) >= max_entries:
                    break
        
        return entries
    except Exception as e:
        logger.error(f"Error reading log file: {e}")
        return []


def get_available_reports():
    """Get list of available reports"""
    reports = []
    try:
        for file in os.listdir(REPORTS_DIR):
            if file.endswith(".json") and file.startswith("audit_analysis_"):
                # Extract timestamp from filename
                timestamp_str = file.replace("audit_analysis_", "").replace(".json", "")
                try:
                    # Convert timestamp to datetime
                    timestamp = datetime.datetime.strptime(
                        timestamp_str, 
                        "%Y%m%d_%H%M%S"
                    )
                    
                    # Add report info
                    reports.append({
                        "filename": file,
                        "timestamp": timestamp,
                        "datetime": timestamp.strftime("%Y-%m-%d %H:%M:%S")
                    })
                except Exception:
                    pass
        
        # Sort by timestamp (newest first)
        reports.sort(key=lambda x: x["timestamp"], reverse=True)
        return reports
    except Exception as e:
        logger.error(f"Error getting reports: {e}")
        return []


def get_log_summary(entries):
    """Generate summary statistics from log entries"""
    if not entries:
        return {
            "total_entries": 0,
            "risk_levels": {},
            "categories": {},
            "log_levels": {}
        }
    
    # Count by risk level, category, and log level
    risk_levels = Counter()
    categories = Counter()
    log_levels = Counter()
    
    for entry in entries:
        risk_levels[entry["risk"]] += 1
        categories[entry["category"]] += 1
        log_levels[entry["level"]] += 1
    
    # Count entries by day
    days = Counter()
    for entry in entries:
        day = entry["timestamp"].date().isoformat()
        days[day] += 1
    
    # Get high risk entries
    high_risk = [
        entry for entry in entries 
        if entry["risk"] in ("HIGH", "CRITICAL")
    ]
    
    return {
        "total_entries": len(entries),
        "risk_levels": dict(risk_levels),
        "categories": dict(categories),
        "log_levels": dict(log_levels),
        "days": dict(days),
        "high_risk_count": len(high_risk)
    }


# Route handlers
@app.route("/")
def index():
    """Dashboard home page"""
    return render_template("index.html", title="ICSF GAMA Audit Dashboard")


@app.route("/logs")
def view_logs():
    """View and filter logs"""
    # Get filter parameters
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    risk_level = request.args.get("risk_level")
    category = request.args.get("category")
    max_entries = int(request.args.get("max_entries", 200))
    
    # Parse dates if provided
    start_date_obj = None
    end_date_obj = None
    
    if start_date:
        try:
            start_date_obj = datetime.datetime.strptime(start_date, "%Y-%m-%d")
        except Exception:
            pass
    
    if end_date:
        try:
            end_date_obj = datetime.datetime.strptime(end_date, "%Y-%m-%d")
            # Set to end of day
            end_date_obj = end_date_obj.replace(
                hour=23, minute=59, second=59, microsecond=999999
            )
        except Exception:
            pass
    
    # Get log entries
    entries = get_log_entries(
        start_date=start_date_obj,
        end_date=end_date_obj,
        max_entries=max_entries,
        risk_level=risk_level,
        category=category
    )
    
    # Prepare entries for template
    display_entries = []
    for entry in entries:
        display_entries.append({
            "timestamp": entry["timestamp"].strftime("%Y-%m-%d %H:%M:%S"),
            "level": entry["level"],
            "risk": entry["risk"],
            "category": entry["category"],
            "message": entry["message"]
        })
    
    # Generate summary
    summary = get_log_summary(entries)
    
    # Get unique categories and risk levels for filters
    unique_categories = list(summary["categories"].keys())
    
    return render_template(
        "logs.html",
        title="View Logs",
        entries=display_entries,
        summary=summary,
        filters={
            "start_date": start_date,
            "end_date": end_date,
            "risk_level": risk_level,
            "category": category,
            "max_entries": max_entries
        },
        categories=unique_categories,
        risk_levels=list(RISK_LEVELS.keys())
    )


@app.route("/reports")
def view_reports():
    """View generated reports"""
    reports = get_available_reports()
    return render_template(
        "reports.html", 
        title="Audit Reports",
        reports=reports
    )


@app.route("/reports/<filename>")
def view_report(filename):
    """View a specific report"""
    file_path = os.path.join(REPORTS_DIR, filename)
    
    if not os.path.exists(file_path) or not filename.startswith("audit_analysis_"):
        abort(404)
    
    try:
        with open(file_path, "r") as f:
            report_data = json.load(f)
        
        return render_template(
            "report_detail.html",
            title="Report Detail",
            filename=filename,
            report=report_data
        )
    except Exception as e:
        logger.error(f"Error loading report {filename}: {e}")
        abort(500)


@app.route("/reports/download/<filename>")
def download_report(filename):
    """Download a report file"""
    if not filename.startswith(("audit_analysis_", "audit_summary_")):
        abort(404)
    
    return send_from_directory(
        REPORTS_DIR, 
        filename,
        as_attachment=True
    )


@app.route("/reports/generate", methods=["GET", "POST"])
def generate_report():
    """Generate a new report"""
    if request.method == "POST":
        # Get parameters
        start_date = request.form.get("start_date")
        end_date = request.form.get("end_date")
        
        # Parse dates
        start_date_obj = None
        end_date_obj = None
        
        if start_date:
            try:
                start_date_obj = datetime.datetime.strptime(start_date, "%Y-%m-%d")
            except Exception:
                pass
        
        if end_date:
            try:
                end_date_obj = datetime.datetime.strptime(end_date, "%Y-%m-%d")
                # Set to end of day
                end_date_obj = end_date_obj.replace(
                    hour=23, minute=59, second=59, microsecond=999999
                )
            except Exception:
                pass
        
        # Check if audit_ai_review module is available
        if "analyze_log_file" in globals() and callable(globals()["analyze_log_file"]):
            try:
                # Generate report
                results = analyze_log_file(
                    COMPLIANCE_LOG, 
                    start_date_obj, 
                    end_date_obj
                )
                
                if results:
                    # Generate timestamp for filenames
                    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                    
                    # Save JSON report
                    json_path = os.path.join(
                        REPORTS_DIR, 
                        f"audit_analysis_{timestamp}.json"
                    )
                    with open(json_path, "w") as f:
                        json.dump(results, f, indent=2)
                    
                    # Save text summary
                    summary_path = os.path.join(
                        REPORTS_DIR, 
                        f"audit_summary_{timestamp}.txt"
                    )
                    
                    # Generate text summary (simplified version)
                    with open(summary_path, "w") as f:
                        f.write("ICSF GAMA AUDIT REPORT\n")
                        f.write("=====================\n\n")
                        f.write(f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                        
                        # Summary statistics
                        summary = results["summary"]
                        f.write(f"Total Entries: {summary['total_entries']}\n")
                        f.write(f"High Risk Entries: {summary['high_risk_entries']}\n")
                        
                        # Risk levels
                        f.write("\nRisk Levels:\n")
                        for risk, count in results["risk_levels"].items():
                            f.write(f"- {risk}: {count}\n")
                        
                        # Categories
                        f.write("\nCategories:\n")
                        for category, count in results["categories"].items():
                            f.write(f"- {category}: {count}\n")
                    
                    # Redirect to view the report
                    return redirect(url_for("view_report", filename=f"audit_analysis_{timestamp}.json"))
                else:
                    return render_template(
                        "generate_report.html",
                        title="Generate Report",
                        error="Failed to generate report. See logs for details."
                    )
            except Exception as e:
                logger.error(f"Error generating report: {e}")
                return render_template(
                    "generate_report.html",
                    title="Generate Report",
                    error=f"Error generating report: {str(e)}"
                )
        else:
            return render_template(
                "generate_report.html",
                title="Generate Report",
                error="Audit AI review module not available. Cannot generate reports."
            )
    
    # GET request - show form
    return render_template(
        "generate_report.html",
        title="Generate Report"
    )


@app.route("/api/logs/summary")
def api_logs_summary():
    """API endpoint for log summary data"""
    # Get filter parameters
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    
    # Parse dates if provided
    start_date_obj = None
    end_date_obj = None
    
    if start_date:
        try:
            start_date_obj = datetime.datetime.strptime(start_date, "%Y-%m-%d")
        except Exception:
            pass
    
    if end_date:
        try:
            end_date_obj = datetime.datetime.strptime(end_date, "%Y-%m-%d")
            # Set to end of day
            end_date_obj = end_date_obj.replace(
                hour=23, minute=59, second=59, microsecond=999999
            )
        except Exception:
            pass
    
    # Get log entries
    entries = get_log_entries(
        start_date=start_date_obj,
        end_date=end_date_obj,
        max_entries=10000  # Higher limit for API
    )
    
    # Generate summary
    summary = get_log_summary(entries)
    
    return jsonify(summary)


@app.route("/api/logs/time-series")
def api_logs_time_series():
    """API endpoint for log time series data"""
    # Get filter parameters
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    
    # Parse dates if provided
    start_date_obj = None
    end_date_obj = None
    
    if start_date:
        try:
            start_date_obj = datetime.datetime.strptime(start_date, "%Y-%m-%d")
        except Exception:
            pass
    
    if end_date:
        try:
            end_date_obj = datetime.datetime.strptime(end_date, "%Y-%m-%d")
            # Set to end of day
            end_date_obj = end_date_obj.replace(
                hour=23, minute=59, second=59, microsecond=999999
            )
        except Exception:
            pass
    
    # Get log entries
    entries = get_log_entries(
        start_date=start_date_obj,
        end_date=end_date_obj,
        max_entries=10000  # Higher limit for API
    )
    
    # Count entries by day and risk level
    days = defaultdict(lambda: defaultdict(int))
    
    for entry in entries:
        day = entry["timestamp"].date().isoformat()
        risk = entry["risk"]
        days[day][risk] += 1
    
    # Convert to list of data points
    data_points = []
    for day, risks in sorted(days.items()):
        data_point = {"date": day}
        for risk, count in risks.items():
            data_point[risk] = count
        data_points.append(data_point)
    
    return jsonify(data_points)


@app.errorhandler(404)
def page_not_found(e):
    return render_template("error.html", title="Page Not Found", error=str(e)), 404


@app.errorhandler(500)
def server_error(e):
    return render_template("error.html", title="Server Error", error=str(e)), 500


if __name__ == "__main__":
    # Parse command line arguments
    import argparse
    
    parser = argparse.ArgumentParser(description="ICSF GAMA Audit Dashboard")
    parser.add_argument(
        "--host", 
        default="0.0.0.0", 
        help="Host to run the server on"
    )
    parser.add_argument(
        "--port", 
        type=int, 
        default=5000, 
        help="Port to run the server on"
    )
    parser.add_argument(
        "--debug", 
        action="store_true", 
        help="Run in debug mode"
    )
    args = parser.parse_args()
    
    # Log startup
    logger.info(f"Starting ICSF GAMA Audit Dashboard on {args.host}:{args.port}")
    
    # Run the app
    app.run(host=args.host, port=args.port, debug=args.debug)