use std::env;
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use walkdir::WalkDir;
use chrono::Utc;

fn is_git_clean() -> bool {
    let output = Command::new("git").args(&["status", "--porcelain"]).output().unwrap();
    output.stdout.is_empty()
}

fn find_unused_code(root: &Path, archive: &Path, dry_run: bool) -> io::Result<()> {
    for entry in WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.starts_with(archive) { continue; }
        if path.is_file() {
            let metadata = fs::metadata(path)?;
            if metadata.len() == 0 { continue; }
            let filename = path.file_name().unwrap().to_string_lossy();
            if filename.ends_with(".bak") || filename.contains("unused") || filename.contains("legacy") {
                let rel_path = path.strip_prefix(root).unwrap();
                let dest = archive.join(rel_path);
                if dry_run {
                    println!("Would archive: {}", rel_path.display());
                } else {
                    fs::create_dir_all(dest.parent().unwrap())?;
                    fs::rename(path, &dest)?;
                    let mut log = fs::OpenOptions::new().append(true).create(true).open(archive.join("ARCHIVE_LOG.txt"))?;
                    writeln!(log, "{} archived {} to {} by cleanup tool", Utc::now(), rel_path.display(), dest.display())?;
                }
            }
        }
    }
    Ok(())
}

fn rebuild_workspace() -> bool {
    let status = Command::new("cargo").arg("build").stdout(Stdio::null()).stderr(Stdio::null()).status().unwrap();
    status.success()
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let dry_run = args.iter().any(|a| a == "--dry-run");
    let root = PathBuf::from(".");
    let archive = root.join("archive");
    if !is_git_clean() {
        eprintln!("Git working directory is not clean. Commit or stash changes before running cleanup.");
        std::process::exit(1);
    }
    if let Err(e) = find_unused_code(&root, &archive, dry_run) {
        eprintln!("Error during cleanup: {}", e);
        std::process::exit(1);
    }
    if !dry_run {
        if !rebuild_workspace() {
            eprintln!("Workspace rebuild failed after cleanup. Review changes and restore from archive if needed.");
            std::process::exit(1);
        }
        println!("Cleanup complete and workspace rebuilt successfully.");
    }
}
