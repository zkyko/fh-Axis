import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { FileText, Code, Folder, FolderOpen, Loader, ExternalLink, ChevronRight, ChevronDown } from 'lucide-react';
import { ipc } from '../ipc';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';

interface TestFile {
  path: string;
  relativePath: string;
  name: string;
  size: number;
}

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  expanded?: boolean;
}

const TestScriptViewer: React.FC<{ repoRoot: string }> = ({ repoRoot }) => {
  const [testFiles, setTestFiles] = useState<TestFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<TestFile | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (repoRoot) {
      loadTestFiles();
    }
  }, [repoRoot]);

  useEffect(() => {
    if (selectedFile && repoRoot) {
      loadFileContent(selectedFile);
    }
  }, [selectedFile, repoRoot]);

  const loadTestFiles = async () => {
    if (!repoRoot) return;
    
    setLoading(true);
    setError(null);
    try {
      const files = await ipc.repo.listTestFiles(repoRoot);
      setTestFiles(files);
      buildFileTree(files);
    } catch (err: any) {
      console.error('Failed to load test files:', err);
      setError(err.message || 'Failed to load test files');
    } finally {
      setLoading(false);
    }
  };

  const buildFileTree = (files: TestFile[]) => {
    const tree: FileTreeNode[] = [];
    const dirMap = new Map<string, FileTreeNode>();

    files.forEach((file) => {
      const parts = file.relativePath.split('/');
      let currentPath = '';
      let currentLevel = tree;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (isLast) {
          // Add file
          const fileNode: FileTreeNode = {
            name: part,
            path: file.relativePath,
            type: 'file',
          };
          currentLevel.push(fileNode);
        } else {
          // Add or get directory
          let dirNode = dirMap.get(currentPath);
          if (!dirNode) {
            dirNode = {
              name: part,
              path: currentPath,
              type: 'directory',
              children: [],
              expanded: expandedDirs.has(currentPath),
            };
            dirMap.set(currentPath, dirNode);
            currentLevel.push(dirNode);
          }
          currentLevel = dirNode.children || [];
        }
      });
    });

    // Sort tree
    const sortTree = (nodes: FileTreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      nodes.forEach((node) => {
        if (node.children) {
          sortTree(node.children);
        }
      });
    };

    sortTree(tree);
    setFileTree(tree);
  };

  const loadFileContent = async (file: TestFile) => {
    if (!repoRoot) return;
    
    setLoading(true);
    try {
      const content = await ipc.repo.readFile(repoRoot, file.relativePath);
      setFileContent(content);
    } catch (err: any) {
      console.error('Failed to load file content:', err);
      setError(err.message || 'Failed to load file content');
      setFileContent('');
    } finally {
      setLoading(false);
    }
  };

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
    
    // Update tree with new expanded state
    const updateTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
      return nodes.map((node) => {
        if (node.type === 'directory') {
          return {
            ...node,
            expanded: newExpanded.has(node.path),
            children: node.children ? updateTree(node.children) : [],
          };
        }
        return node;
      });
    };
    setFileTree(updateTree(fileTree));
  };

  const renderFileTree = (nodes: FileTreeNode[], level: number = 0): React.ReactNode => {
    return nodes.map((node) => {
      if (node.type === 'directory') {
        const isExpanded = expandedDirs.has(node.path);
        return (
          <div key={node.path}>
            <div
              className="flex items-center gap-1 px-2 py-1 hover:bg-base-200 cursor-pointer rounded"
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => toggleDirectory(node.path)}
            >
              {isExpanded ? (
                <ChevronDown size={14} className="text-base-content/60" />
              ) : (
                <ChevronRight size={14} className="text-base-content/60" />
              )}
              {isExpanded ? (
                <FolderOpen size={16} className="text-primary" />
              ) : (
                <Folder size={16} className="text-base-content/60" />
              )}
              <span className="text-sm">{node.name}</span>
            </div>
            {isExpanded && node.children && (
              <div>{renderFileTree(node.children, level + 1)}</div>
            )}
          </div>
        );
      } else {
        const file = testFiles.find((f) => f.relativePath === node.path);
        const isSelected = selectedFile?.relativePath === node.path;
        return (
          <div
            key={node.path}
            className={`flex items-center gap-2 px-2 py-1 cursor-pointer rounded ${
              isSelected ? 'bg-primary/20 text-primary' : 'hover:bg-base-200'
            }`}
            style={{ paddingLeft: `${level * 16 + 24}px` }}
            onClick={() => file && setSelectedFile(file)}
          >
            <FileText size={14} className={isSelected ? 'text-primary' : 'text-base-content/60'} />
            <span className="text-sm font-mono">{node.name}</span>
          </div>
        );
      }
    });
  };

  const getLanguage = (fileName: string): string => {
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return 'typescript';
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return 'javascript';
    if (fileName.endsWith('.py')) return 'python';
    if (fileName.endsWith('.java')) return 'java';
    if (fileName.endsWith('.go')) return 'go';
    return 'plaintext';
  };

  const handleOpenInVSCode = async () => {
    if (selectedFile && repoRoot) {
      await ipc.repo.openVSCode(repoRoot);
    }
  };

  if (error && testFiles.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={FileText}
          title="Failed to Load Test Files"
          description={error}
          action={
            <button className="btn btn-primary" onClick={loadTestFiles}>
              Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* File Tree Sidebar */}
      <div className="w-64 border-r border-base-300 bg-base-200/50 overflow-y-auto">
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-base-content">Test Files</h3>
            <button
              className="btn btn-xs btn-ghost"
              onClick={loadTestFiles}
              disabled={loading}
            >
              <Loader size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="text-xs text-base-content/60">
            {testFiles.length} test file{testFiles.length !== 1 ? 's' : ''} found
          </div>
        </div>
        <div className="p-2">
          {loading && testFiles.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-6" />
              ))}
            </div>
          ) : fileTree.length === 0 ? (
            <div className="p-4 text-center text-sm text-base-content/60">
              No test files found
            </div>
          ) : (
            <div>{renderFileTree(fileTree)}</div>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col">
        {selectedFile ? (
          <>
            <div className="border-b border-base-300 bg-base-200/50 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                <div>
                  <div className="font-semibold text-base-content">{selectedFile.name}</div>
                  <div className="text-xs text-base-content/60 font-mono">
                    {selectedFile.relativePath}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleOpenInVSCode}
                title="Open in VS Code"
              >
                <Code size={16} />
                Open in VS Code
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader className="animate-spin text-primary" size={32} />
                </div>
              ) : (
                <Editor
                  height="100%"
                  language={getLanguage(selectedFile.name)}
                  value={fileContent}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: true },
                    fontSize: 14,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                  }}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={FileText}
              title="No File Selected"
              description="Select a test file from the sidebar to view its contents"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TestScriptViewer;

