# Archive Directory

This directory contains archived code, assets, and documentation that are no longer actively used in the project but are preserved for reference.

## Directory Structure

- `legacy_code/`: Contains deprecated code files organized by type
  - `components/`: Archived React components
  - `utils/`: Archived utility functions
  - `styles/`: Archived style files
- `unused_assets/`: Archived media files and other assets
- `redundant_configs/`: Archived configuration files
- `experimental/`: Experimental features and prototypes
- `documentation/`: Archived documentation

## Archiving Guidelines

1. Code is moved here when:
   - It's no longer used in the active codebase
   - It's been replaced by a better implementation
   - It's experimental and not ready for production
   - It's deprecated but might be useful for reference

2. Before archiving:
   - Add a comment explaining why the code was archived
   - Document any dependencies or requirements
   - Note the date of archiving
   - Reference any related tickets or issues

3. Archive Maintenance:
   - Review archived code quarterly
   - Remove completely obsolete code
   - Update documentation as needed
   - Keep the structure organized

## Using Archived Code

When referencing archived code:
1. Check the date of archiving
2. Review any comments or documentation
3. Test thoroughly before reusing
4. Update to current standards if reimplementing

## Cleanup Process

The cleanup process is automated using the `scripts/cleanup.js` script. This script:
1. Identifies unused files using depcheck
2. Moves them to appropriate archive directories
3. Maintains the archive structure
4. Logs all moves for tracking

To run the cleanup:
```bash
node scripts/cleanup.js
```