import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { StorageService } from '../../services/storage';

declare var mermaid: any;

@Component({
  selector: 'app-documentacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documentacion.component.html',
  styleUrls: ['./documentacion.component.css']
})
export class DocumentacionComponent implements OnInit {
  today = new Date();
  docList: string[] = []; // All files from API
  currentDocs: string[] = []; // Files/folders in current view
  currentFolders: string[] = [];
  selectedDoc: string | null = null;
  docContent: SafeHtml = '';
  loading = false;
  
  currentPath = ''; // Current navigation path
  
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private storageService = inject(StorageService);
  private apiUrl = environment.apiUrl;

  ngOnInit(): void {
    this.loadDocList();
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
    }
  }

  loadDocList(): void {
    this.http.get<string[]>(`${this.apiUrl}/docs/list`).subscribe({
      next: (data: string[]) => {
        this.docList = data;
        this.updateView();
      },
      error: (err: any) => console.error('Error loading doc list', err)
    });
  }

  updateView(): void {
    const prefix = this.currentPath ? this.currentPath + '/' : '';
    
    // Get unique items at current level
    const items = this.docList
      .filter(d => d.startsWith(prefix))
      .map(d => d.substring(prefix.length));

    this.currentFolders = [...new Set(items
      .filter(d => d.includes('/'))
      .map(d => d.split('/')[0]))];

    this.currentDocs = items.filter(d => !d.includes('/'));
  }

  navigateTo(folder: string): void {
    this.currentPath = this.currentPath ? `${this.currentPath}/${folder}` : folder;
    this.selectedDoc = null;
    this.updateView();
  }

  goBack(): void {
    if (this.selectedDoc) {
      this.selectedDoc = null;
    } else if (this.currentPath) {
      const parts = this.currentPath.split('/');
      parts.pop();
      this.currentPath = parts.join('/');
      this.updateView();
    }
  }

  viewDoc(filename: string): void {
    const fullPath = this.currentPath ? `${this.currentPath}/${filename}` : filename;
    this.selectedDoc = filename;
    this.loading = true;

    if (this.isImage(filename)) {
      this.docContent = ''; // Clear markdown content
      this.loading = false;
      return;
    }

    this.http.get(`${this.apiUrl}/docs/${fullPath}`, { responseType: 'text' }).subscribe({
      next: (markdown: string) => {
        this.docContent = this.sanitizer.sanitize(1, this.parseMarkdown(markdown)) || '';
        this.loading = false;
        
        // Trigger mermaid rendering after a short delay to allow DOM update
        setTimeout(() => {
          if (typeof mermaid !== 'undefined') {
            mermaid.run();
          }
        }, 100);
      },
      error: (err: any) => {
        console.error('Error loading doc', err);
        this.loading = false;
      }
    });
  }

  isImage(filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    return ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '');
  }

  getDocUrl(filename: string): string {
    const fullPath = this.currentPath ? `${this.currentPath}/${filename}` : filename;
    return `${this.apiUrl}/docs/${fullPath}`;
  }

  get breadcrumbs(): string[] {
    return ['Reyval', 'Docs', ...this.currentPath.split('/').filter(p => p)];
  }

  parseMarkdown(md: string): string {
    if (!md) return '';
    
    // 1. Detect Mermaid blocks first and protect them
    let mermaidBlocks: string[] = [];
    let processedMd = md.replace(/```mermaid([\s\S]*?)```/g, (match, code) => {
      mermaidBlocks.push(code.trim());
      return `__MERMAID_BLOCK_${mermaidBlocks.length - 1}__`;
    });

    // 2. Detect Code Blocks and protect them
    let codeBlocks: string[] = [];
    processedMd = processedMd.replace(/```(?:[a-z]*)?([\s\S]*?)```/g, (match, code) => {
      codeBlocks.push(code.trim());
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    let html = processedMd
      // Tables (Basic support)
      .replace(/^\|(.+)\|$/gim, (match, row) => {
        const cells = row.split('|').map((c: string) => c.trim()).filter((c: string) => c !== '');
        const isHeaderLine = row.includes('---');
        if (isHeaderLine) return '';
        // If it looks like a header (first row or followed by ---), use th
        const tag = cells.every((c: string) => c.length > 0) ? 'td' : 'td'; // Default to td, handled by CSS
        return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join('')}</tr>`;
      })
      // Wrap table rows
      .replace(/(<tr>.*?<\/tr>)+/gim, '<div class="table-responsive my-4"><table class="table table-bordered table-striped">$1</table></div>')
      
      // Horizontal Rule
      .replace(/^---$/gim, '<hr class="my-5 border-top">')

      // Images - Ensuring path is sanitized and absolute to the API root
      .replace(/!\[(.*?)\]\((.*?)\)/gim, (match, alt, path) => {
        const finalPath = (path.startsWith('http') || path.startsWith('/')) ? path : `${this.apiUrl}/docs/${path}`;
        return `<div class="my-5 text-center"><img src="${finalPath}" alt="${alt}" class="img-fluid rounded shadow-lg border" style="max-height: 500px; display: inline-block;"></div>`;
      })
      
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="mt-4 mb-3 text-primary">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="mt-5 mb-3 border-bottom pb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="mb-4 text-dark fw-bold">$1</h1>')
      
      // Bold & Italic
      .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      
      // Inline Code
      .replace(/`(.*?)`/gim, '<code class="bg-light px-1 rounded text-danger">$1</code>')

      // Lists
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="blockquote border-start ps-3 py-1 my-3 bg-light">$1</blockquote>')
      
      // Info/Tip blocks (Ad-hoc support for our style)
      .replace(/!TIP\]<\/blockquote>/gim, '<div class="alert alert-info py-2 my-3"><i class="fas fa-lightbulb me-2"></i> <strong>TIP:</strong>')
      .replace(/!IMPORTANT\]<\/blockquote>/gim, '<div class="alert alert-warning py-2 my-3"><i class="fas fa-exclamation-triangle me-2"></i> <strong>IMPORTANTE:</strong>')
      .replace(/!CAUTION\]<\/blockquote>/gim, '<div class="alert alert-danger py-2 my-3"><i class="fas fa-hand-paper me-2"></i> <strong>CUIDADO:</strong>')
      .replace(/!WARNING\]<\/blockquote>/gim, '<div class="alert alert-danger py-2 my-3"><i class="fas fa-exclamation-circle me-2"></i> <strong>ADVERTENCIA:</strong>')
      .replace(/!NOTE\]<\/blockquote>/gim, '<div class="alert alert-secondary py-2 my-3"><i class="fas fa-info-circle me-2"></i> <strong>NOTA:</strong>')
      
      // Close alert divs if they were opened
      .replace(/(<div class="alert.*?<\/blockquote>)/gim, (match) => match.replace('</blockquote>', '</div>'))
      
      // Line breaks
      .replace(/\n(?!(?:|<\/tr>|<\/table>|<\/ul>|<\/li>|<\/h[1-6]>|<\/div>|<\/hr>))/gim, '<br>');
    
    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li>.*?<\/li>(<br>)?)+/gim, '<ul class="mb-4">$&</ul>');
    
    // Restore and wrap mermaid blocks
    mermaidBlocks.forEach((code, i) => {
      html = html.replace(`__MERMAID_BLOCK_${i}__`, `<div class="mermaid my-4">${code}</div>`);
    });

    // Restore and wrap code blocks
    codeBlocks.forEach((code, i) => {
      html = html.replace(`__CODE_BLOCK_${i}__`, `<pre class="bg-dark text-light p-3 rounded my-4 overflow-auto"><code>${code}</code></pre>`);
    });
    
    return html;
  }

  printDoc(): void {
    window.print();
  }
}
