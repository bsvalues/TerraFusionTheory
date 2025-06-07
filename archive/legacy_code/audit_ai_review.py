#!/usr/bin/env python3
"""
ICSF GAMA AI Audit Review Tool

This tool uses AI to analyze ICSF GAMA audit logs for compliance issues,
anomalies, and potential problems. It generates reports for assessment
professionals and administrators to ensure proper system usage.

The AI review process:
1. Parses compliance audit logs
2. Identifies patterns and potential issues
3. Classifies entries by risk level and category
4. Produces executive summary and detailed reports

No external API calls are made - all processing is done locally using
built-in NLP capabilities.
"""

import os
import re
import sys
import json
import logging
import argparse
import datetime
from pathlib import Path
from collections import Counter, defaultdict

# Setup logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(log_dir, exist_ok=True)
review_log_file = os.path.join(log_dir, "audit_review.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(review_log_file),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("ICSF_AUDIT_REVIEW")

# Default paths
CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config")
LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
COMPLIANCE_LOG = os.path.join(LOG_PATH, "compliance_audit.log")
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")

# Risk levels
RISK_LEVELS = {
    "LOW": 1,
    "MEDIUM": 2,
    "HIGH": 3,
    "CRITICAL": 4
}

# Known compliance keywords and patterns
COMPLIANCE_PATTERNS = {
    # Configuration changes
    r"parameter.*(changed|modified)": {
        "category": "CONFIGURATION_CHANGE",
        "risk": "LOW"
    },
    r"policy_id.*changed": {
        "category": "POLICY_CHANGE",
        "risk": "MEDIUM"
    },
    
    # Valuation anomalies
    r"(adjustment|value).*exceeds.*threshold": {
        "category": "VALUATION_ANOMALY",
        "risk": "MEDIUM"
    },
    r"outlier detected": {
        "category": "VALUATION_ANOMALY",
        "risk": "MEDIUM"
    },
    r"extreme value": {
        "category": "VALUATION_ANOMALY",
        "risk": "HIGH"
    },
    
    # System operations
    r"simulation (started|completed)": {
        "category": "SIMULATION_EVENT",
        "risk": "LOW"
    },
    r"error.*simulation": {
        "category": "SIMULATION_ERROR",
        "risk": "MEDIUM"
    },
    r"failed to (run|execute)": {
        "category": "SIMULATION_ERROR",
        "risk": "MEDIUM"
    },
    
    # User actions
    r"user.*logged in": {
        "category": "USER_ACCESS",
        "risk": "LOW"
    },
    r"unauthorized (access|attempt)": {
        "category": "SECURITY_VIOLATION",
        "risk": "HIGH"
    },
    r"exported.*data": {
        "category": "DATA_EXPORT",
        "risk": "MEDIUM"
    },
    
    # Data integrity
    r"data integrity (check|validation)": {
        "category": "DATA_INTEGRITY",
        "risk": "LOW"
    },
    r"integrity.*failed": {
        "category": "DATA_INTEGRITY_VIOLATION",
        "risk": "HIGH"
    },
    r"(modified|tampered).*output": {
        "category": "DATA_INTEGRITY_VIOLATION",
        "risk": "CRITICAL"
    },
    
    # System health
    r"low (disk|memory)": {
        "category": "SYSTEM_HEALTH",
        "risk": "MEDIUM"
    },
    r"(crash|exception|traceback)": {
        "category": "SYSTEM_ERROR",
        "risk": "MEDIUM" 
    }
}


def parse_log_entry(line):
    """Parse a log entry into timestamp, level, and message components"""
    # Expected format: 2025-05-15 10:30:45,123 - ICSF_GAMA - INFO - Message here
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
        logger.debug(f"Error parsing log entry: {e}")
        return None


def classify_log_entry(entry):
    """Classify a log entry by risk level and category based on message content"""
    if not entry or "message" not in entry:
        return None
    
    message = entry["message"].lower()
    
    # Start with default classification
    classification = {
        "category": "GENERAL",
        "risk": "LOW",
        "risk_level": RISK_LEVELS["LOW"]
    }
    
    # Check against known patterns
    for pattern, metadata in COMPLIANCE_PATTERNS.items():
        if re.search(pattern, message, re.IGNORECASE):
            classification["category"] = metadata["category"]
            classification["risk"] = metadata["risk"]
            classification["risk_level"] = RISK_LEVELS[metadata["risk"]]
    
    # Adjust based on log level
    if entry["level"] == "ERROR":
        # Increase risk for error entries
        current_level = classification["risk_level"]
        classification["risk_level"] = min(current_level + 1, RISK_LEVELS["CRITICAL"])
        
        # Update risk label
        for label, level in RISK_LEVELS.items():
            if level == classification["risk_level"]:
                classification["risk"] = label
                break
    
    elif entry["level"] == "WARNING" and classification["risk"] == "LOW":
        classification["risk"] = "MEDIUM"
        classification["risk_level"] = RISK_LEVELS["MEDIUM"]
    
    return {**entry, **classification}


def analyze_log_file(log_file=None, start_date=None, end_date=None):
    """
    Analyze a log file for compliance issues
    
    Args:
        log_file: Path to log file (default: COMPLIANCE_LOG)
        start_date: Start date for analysis (default: all entries)
        end_date: End date for analysis (default: all entries)
    
    Returns:
        dict: Analysis results
    """
    file_path = log_file or COMPLIANCE_LOG
    
    if not os.path.exists(file_path):
        logger.error(f"Log file not found: {file_path}")
        return None
    
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
                if classified_entry:
                    entries.append(classified_entry)
        
        # Count entries by category and risk level
        categories = Counter()
        risk_levels = Counter()
        category_risks = defaultdict(Counter)
        
        for entry in entries:
            categories[entry["category"]] += 1
            risk_levels[entry["risk"]] += 1
            category_risks[entry["category"]][entry["risk"]] += 1
        
        # Find high risk entries
        high_risk_entries = [
            entry for entry in entries 
            if entry["risk"] in ("HIGH", "CRITICAL")
        ]
        
        # Generate time series data (entries per day)
        time_series = defaultdict(int)
        for entry in entries:
            day = entry["timestamp"].date().isoformat()
            time_series[day] += 1
        
        # Summary statistics
        total_entries = len(entries)
        unique_categories = len(categories)
        high_risk_count = sum(count for risk, count in risk_levels.items() 
                             if risk in ("HIGH", "CRITICAL"))
        
        # Construct analysis results
        results = {
            "summary": {
                "total_entries": total_entries,
                "high_risk_entries": high_risk_count,
                "unique_categories": unique_categories,
                "analysis_timestamp": datetime.datetime.now().isoformat()
            },
            "categories": dict(categories),
            "risk_levels": dict(risk_levels),
            "category_risks": {cat: dict(risks) for cat, risks in category_risks.items()},
            "time_series": dict(time_series),
            "high_risk_entries": [
                {
                    "timestamp": entry["timestamp"].isoformat(),
                    "category": entry["category"],
                    "risk": entry["risk"],
                    "message": entry["message"],
                    "level": entry["level"]
                }
                for entry in high_risk_entries
            ]
        }
        
        return results
    except Exception as e:
        logger.error(f"Error analyzing log file: {e}")
        return None


def generate_reports(analysis_results, output_dir=None):
    """
    Generate audit review reports from analysis results
    
    Args:
        analysis_results: Analysis results from analyze_log_file()
        output_dir: Directory to write reports to (default: OUTPUT_PATH)
    
    Returns:
        dict: Paths to generated reports
    """
    if not analysis_results:
        logger.error("No analysis results to generate reports from")
        return None
    
    # Create output directory
    dest_dir = output_dir or OUTPUT_PATH
    os.makedirs(dest_dir, exist_ok=True)
    
    # Generate timestamp for report filenames
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    
    report_files = {}
    
    try:
        # JSON report (full details)
        json_path = os.path.join(dest_dir, f"audit_analysis_{timestamp}.json")
        with open(json_path, "w") as f:
            json.dump(analysis_results, f, indent=2)
        
        report_files["json"] = json_path
        
        # Text summary report
        summary_path = os.path.join(dest_dir, f"audit_summary_{timestamp}.txt")
        with open(summary_path, "w") as f:
            f.write("ICSF GAMA AUDIT REVIEW SUMMARY\n")
            f.write("=============================\n\n")
            
            # Generate timestamp
            gen_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            f.write(f"Generated: {gen_time}\n\n")
            
            # Write summary statistics
            summary = analysis_results["summary"]
            f.write(f"Total Entries: {summary['total_entries']}\n")
            f.write(f"High Risk Entries: {summary['high_risk_entries']}\n")
            f.write(f"Categories: {summary['unique_categories']}\n\n")
            
            # Write risk level breakdown
            f.write("RISK LEVEL BREAKDOWN\n")
            f.write("-------------------\n")
            risk_levels = analysis_results["risk_levels"]
            for risk in sorted(risk_levels.keys(), 
                               key=lambda r: RISK_LEVELS.get(r, 0),
                               reverse=True):
                count = risk_levels[risk]
                percentage = (count / summary['total_entries']) * 100
                f.write(f"{risk}: {count} ({percentage:.1f}%)\n")
            
            f.write("\n")
            
            # Write category breakdown
            f.write("CATEGORY BREAKDOWN\n")
            f.write("-----------------\n")
            categories = analysis_results["categories"]
            for category, count in sorted(categories.items(), 
                                         key=lambda x: x[1], 
                                         reverse=True):
                percentage = (count / summary['total_entries']) * 100
                f.write(f"{category}: {count} ({percentage:.1f}%)\n")
            
            f.write("\n")
            
            # High risk entries
            high_risk = analysis_results["high_risk_entries"]
            if high_risk:
                f.write("HIGH RISK ENTRIES\n")
                f.write("----------------\n")
                for i, entry in enumerate(high_risk[:10], 1):  # Show top 10
                    f.write(f"{i}. [{entry['timestamp']}] {entry['risk']} - {entry['category']}\n")
                    f.write(f"   {entry['message']}\n\n")
                
                if len(high_risk) > 10:
                    f.write(f"...and {len(high_risk) - 10} more high risk entries\n\n")
            else:
                f.write("No high risk entries found.\n\n")
            
            # Recommendations
            f.write("RECOMMENDATIONS\n")
            f.write("--------------\n")
            
            # Generate some basic recommendations based on findings
            if summary["high_risk_entries"] > 0:
                f.write("1. URGENT: Review all high risk entries immediately.\n")
            
            common_categories = [cat for cat, count in categories.items() 
                               if count > summary['total_entries'] * 0.1]
            
            if "DATA_INTEGRITY_VIOLATION" in categories:
                f.write("2. Investigate potential data integrity issues.\n")
            
            if "SECURITY_VIOLATION" in categories:
                f.write("3. Review security policies and access controls.\n")
            
            if "SIMULATION_ERROR" in categories:
                f.write("4. Check simulation parameters and configuration.\n")
            
            if "VALUATION_ANOMALY" in categories:
                f.write("5. Examine valuation models for potential issues.\n")
        
        report_files["summary"] = summary_path
        
        logger.info(f"Generated reports at {dest_dir}")
        return report_files
    except Exception as e:
        logger.error(f"Error generating reports: {e}")
        return None


def parse_date(date_str):
    """Parse a date string in YYYY-MM-DD format"""
    if not date_str:
        return None
    
    try:
        return datetime.datetime.strptime(date_str, "%Y-%m-%d")
    except Exception as e:
        logger.error(f"Error parsing date '{date_str}': {e}")
        return None


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="ICSF GAMA AI Audit Review Tool")
    parser.add_argument(
        "--log-file", 
        help="Path to log file (default: compliance_audit.log)"
    )
    parser.add_argument(
        "--output-dir", 
        help="Directory to write reports to (default: reports)"
    )
    parser.add_argument(
        "--start-date",
        help="Start date for analysis (YYYY-MM-DD)"
    )
    parser.add_argument(
        "--end-date",
        help="End date for analysis (YYYY-MM-DD)"
    )
    return parser.parse_args()


def main():
    """Main entry point"""
    args = parse_arguments()
    
    logger.info("Starting ICSF GAMA AI Audit Review")
    
    # Parse date arguments
    start_date = parse_date(args.start_date)
    end_date = parse_date(args.end_date)
    
    # Analyze log file
    results = analyze_log_file(args.log_file, start_date, end_date)
    
    if not results:
        logger.error("No analysis results generated")
        return 1
    
    # Generate reports
    reports = generate_reports(results, args.output_dir)
    
    if not reports:
        logger.error("Failed to generate reports")
        return 1
    
    logger.info(f"Analysis complete. Reports generated:")
    for report_type, path in reports.items():
        logger.info(f"  {report_type}: {path}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())