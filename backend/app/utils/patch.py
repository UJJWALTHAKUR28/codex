"""Patch utility functions for applying unified diffs."""
import os
import re

def apply_unified_diff(repo_path: str, patch_content: str):
    """
    Apply a unified diff patch to files in a repository.
    
    Args:
        repo_path: Path to the repository
        patch_content: Unified diff patch content
    """
    # Parse patch content
    patches = parse_patch(patch_content)
    
    for file_patch in patches:
        file_path = file_patch['path']
        full_path = os.path.join(repo_path, file_path)
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Apply changes
        if file_patch['is_new']:
            # New file
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(file_patch['new_content'])
        elif file_patch['is_deleted']:
            # Delete file
            if os.path.exists(full_path):
                os.remove(full_path)
        else:
            # Modify existing file
            if os.path.exists(full_path):
                with open(full_path, 'r', encoding='utf-8') as f:
                    original_content = f.read()
                
                # Apply diff
                new_content = apply_diff_to_content(original_content, file_patch['hunks'])
                
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)

def parse_patch(patch_content: str):
    """Parse unified diff patch content into structured format."""
    patches = []
    current_patch = None
    
    lines = patch_content.split('\n')
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Check for file header
        if line.startswith('--- '):
            if current_patch:
                patches.append(current_patch)
            
            # Extract file path
            old_file = line[4:].strip()
            i += 1
            
            if i < len(lines) and lines[i].startswith('+++ '):
                new_file = lines[i][4:].strip()
                i += 1
                
                # Determine if new, deleted, or modified
                is_new = old_file == '/dev/null' or old_file.startswith('a/')
                is_deleted = new_file == '/dev/null'
                
                # Extract actual path
                if is_new and new_file.startswith('b/'):
                    path = new_file[2:]
                elif old_file.startswith('a/'):
                    path = old_file[2:]
                else:
                    path = new_file
                
                current_patch = {
                    'path': path,
                    'is_new': is_new,
                    'is_deleted': is_deleted,
                    'hunks': [],
                    'new_content': ''
                }
        
        # Check for hunk header
        elif line.startswith('@@'):
            if current_patch:
                hunk = {'header': line, 'lines': []}
                current_patch['hunks'].append(hunk)
        
        # Content lines
        elif current_patch:
            if line.startswith('+') and not line.startswith('+++'):
                # Addition
                if current_patch['is_new']:
                    current_patch['new_content'] += line[1:] + '\n'
                elif current_patch['hunks']:
                    current_patch['hunks'][-1]['lines'].append(('add', line[1:]))
            elif line.startswith('-') and not line.startswith('---'):
                # Deletion
                if current_patch['hunks']:
                    current_patch['hunks'][-1]['lines'].append(('del', line[1:]))
            elif line.startswith(' '):
                # Context
                if current_patch['hunks']:
                    current_patch['hunks'][-1]['lines'].append(('ctx', line[1:]))
        
        i += 1
    
    if current_patch:
        patches.append(current_patch)
    
    return patches

def apply_diff_to_content(original: str, hunks: list):
    """Apply diff hunks to original content."""
    lines = original.split('\n')
    result = []
    line_idx = 0
    
    for hunk in hunks:
        # Parse hunk header to get line numbers
        # Format: @@ -old_start,old_count +new_start,new_count @@
        match = re.match(r'@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@', hunk['header'])
        if match:
            old_start = int(match.group(1)) - 1  # Convert to 0-indexed
            
            # Copy lines before hunk
            while line_idx < old_start and line_idx < len(lines):
                result.append(lines[line_idx])
                line_idx += 1
            
            # Apply hunk changes
            for change_type, content in hunk['lines']:
                if change_type == 'ctx':
                    # Context line - copy from original
                    if line_idx < len(lines):
                        result.append(lines[line_idx])
                        line_idx += 1
                elif change_type == 'add':
                    # Addition - add new line
                    result.append(content)
                elif change_type == 'del':
                    # Deletion - skip original line
                    line_idx += 1
    
    # Copy remaining lines
    while line_idx < len(lines):
        result.append(lines[line_idx])
        line_idx += 1
    
    return '\n'.join(result)
