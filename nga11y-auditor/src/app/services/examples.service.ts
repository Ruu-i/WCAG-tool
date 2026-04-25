import { Injectable } from '@angular/core';
import { EditorContent } from '../components/code-editor/code-editor.component';

export interface Example {
  id: string;
  label: string;
  description: string;
  violationCount: number;
  content: EditorContent;
}

@Injectable({ providedIn: 'root' })
export class ExamplesService {
  readonly examples: Example[] = [
    {
      id: 'login-form',
      label: 'Login Form',
      description: 'Missing labels, no error roles, bad submit button',
      violationCount: 4,
      content: {
        templateCode: `<div class="login-wrapper">
  <h2>Sign In</h2>
  <div class="form-group">
    <input type="text" placeholder="Email address" [(ngModel)]="email" />
  </div>
  <div class="form-group">
    <input type="password" placeholder="Password" [(ngModel)]="password" />
  </div>
  <div class="error-message" *ngIf="errorMsg">
    {{ errorMsg }}
  </div>
  <div class="actions">
    <button (click)="login()">Sign In</button>
    <a href="/forgot-password">Forgot password?</a>
  </div>
</div>`.trim(),
        tsCode: '',
      },
    },
    {
      id: 'product-card',
      label: 'Product Card',
      description: 'Missing alt text, colour-only info, ambiguous buttons',
      violationCount: 4,
      content: {
        templateCode: `<div class="product-card">
  <img src="product-hero.jpg" />
  <div class="badges">
    <span class="badge sale">SALE</span>
    <span class="badge new" style="color: #aaa; background: #fff;">NEW</span>
  </div>
  <h3>Wireless Headphones Pro</h3>
  <div class="pricing">
    <span class="original-price" style="color: red; text-decoration: line-through;">£99.99</span>
    <span class="sale-price">£74.99</span>
  </div>
  <p class="description">Premium sound quality with 30-hour battery life.</p>
  <div class="actions">
    <button (click)="addToCart()">Buy now</button>
    <button (click)="addToWishlist()">♥</button>
  </div>
</div>`.trim(),
        tsCode: '',
      },
    },
    {
      id: 'nav-menu',
      label: 'Navigation Menu',
      description: 'No landmark, no keyboard handler, no skip link',
      violationCount: 4,
      content: {
        templateCode: `<div class="site-header">
  <div class="logo">MyApp</div>
  <div class="nav-items">
    <a href="/" class="nav-item active">Home</a>
    <div class="nav-item dropdown" (click)="toggleDropdown('products')">
      Products
      <div class="dropdown-menu" *ngIf="openDropdown === 'products'">
        <a href="/products/software">Software</a>
        <a href="/products/hardware">Hardware</a>
      </div>
    </div>
    <a href="/pricing" class="nav-item">Pricing</a>
    <a href="/about" class="nav-item">About</a>
  </div>
  <div class="header-actions">
    <div class="icon-btn" (click)="openSearch()">🔍</div>
    <div class="icon-btn" (click)="openCart()">🛒</div>
  </div>
</div>`.trim(),
        tsCode: '',
      },
    },
    {
      id: 'modal-dialog',
      label: 'Modal Dialog',
      description: 'No focus trap, div close button, no ESC key handler',
      violationCount: 4,
      content: {
        templateCode: `<div class="modal-overlay" *ngIf="isOpen" (click)="closeOnOverlay($event)">
  <div class="modal-container">
    <div class="modal-header">
      <h3>Confirm Delete</h3>
      <div class="close-btn" (click)="close()">✕</div>
    </div>
    <div class="modal-body">
      <p>Are you sure you want to delete this item? This action cannot be undone.</p>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" (click)="close()">Cancel</button>
      <button class="btn-danger" (click)="confirm()">Delete</button>
    </div>
  </div>
</div>`.trim(),
        tsCode: `import { Component, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();

  close(): void {
    this.dismissed.emit();
  }

  confirm(): void {
    this.confirmed.emit();
    this.close();
  }

  closeOnOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }
}`.trim(),
      },
    },
    {
      id: 'data-table',
      label: 'Data Table',
      description: 'No scope on th, inaccessible sort headers, no caption',
      violationCount: 4,
      content: {
        templateCode: `<div class="table-container">
  <table>
    <tr>
      <th (click)="sort('name')">Name</th>
      <th (click)="sort('status')">Status</th>
      <th (click)="sort('date')">Date</th>
      <th>Actions</th>
    </tr>
    <tr *ngFor="let item of items">
      <td>{{ item.name }}</td>
      <td>
        <span [class]="'badge ' + item.status">{{ item.status }}</span>
      </td>
      <td>{{ item.date }}</td>
      <td>
        <button (click)="edit(item)">Edit</button>
        <button (click)="delete(item)">Delete</button>
      </td>
    </tr>
    <tr *ngIf="!items.length">
      <td colspan="4"></td>
    </tr>
  </table>
</div>`.trim(),
        tsCode: '',
      },
    },
    {
      id: 'notification-toast',
      label: 'Notification Toast',
      description: 'No live region, dismiss is a span, no role=alert',
      violationCount: 4,
      content: {
        templateCode: `<div class="toast-stack">
  <div
    *ngFor="let toast of toasts"
    class="toast"
    [class.toast-success]="toast.type === 'success'"
    [class.toast-error]="toast.type === 'error'"
  >
    <div class="toast-content">
      <strong>{{ toast.title }}</strong>
      <p>{{ toast.message }}</p>
    </div>
    <span class="toast-dismiss" (click)="dismiss(toast.id)">✕</span>
  </div>
</div>`.trim(),
        tsCode: '',
      },
    },
  ];

  getById(id: string): Example | undefined {
    return this.examples.find(e => e.id === id);
  }
}
