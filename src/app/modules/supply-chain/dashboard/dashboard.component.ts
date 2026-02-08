import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupplyChainService } from '../../../services/supply-chain.service';

@Component({
  selector: 'app-supply-chain-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, RouterModule],
  standalone: true,
})
export class SupplyChainDashboardComponent implements OnInit {
  isLoading = false;
  stats = {
    materials: 0,
    suppliers: 0,
    projects: 0,
    requisitions: 0,
    purchaseOrders: 0,
    pendingRequisitions: 0,
    openPOs: 0,
    lowStockItems: 0
  };

  recentRequisitions: any[] = [];
  recentPOs: any[] = [];
  lowStockMaterials: any[] = [];

  quickLinks = [
    {
      title: 'Material Master',
      description: 'Manage materials and inventory items',
      icon: '📦',
      route: '/supply-chain/material-master',
      color: 'bg-blue-500'
    },
    {
      title: 'Suppliers',
      description: 'Manage supplier directory',
      icon: '🏢',
      route: '/supply-chain/suppliers',
      color: 'bg-green-500'
    },
    {
      title: 'Projects',
      description: 'Manage project sites and warehouses',
      icon: '🏗️',
      route: '/supply-chain/projects',
      color: 'bg-purple-500'
    },
    {
      title: 'Requisitions',
      description: 'Create and manage material requests',
      icon: '📋',
      route: '/supply-chain/requisition-workflow',
      color: 'bg-orange-500'
    },
    {
      title: 'Purchase Orders',
      description: 'Create and track purchase orders',
      icon: '🛒',
      route: '/supply-chain/purchase-orders',
      color: 'bg-indigo-500'
    },
    {
      title: 'Goods Receipt',
      description: 'Record received materials (GRN)',
      icon: '📥',
      route: '/supply-chain/grn',
      color: 'bg-teal-500'
    },
    {
      title: 'Disbursements',
      description: 'Issue materials to projects',
      icon: '📤',
      route: '/supply-chain/disbursements',
      color: 'bg-pink-500'
    }
  ];

  constructor(
    private supplyChainService: SupplyChainService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    this.isLoading = true;
    try {
      const orgId = 'org1';
      
      // Load all data
      const [materials, suppliers, projects, requisitions, pos] = await Promise.all([
        this.supplyChainService.getMaterialsByOrg(orgId),
        this.supplyChainService.getSuppliersByOrg(orgId),
        this.supplyChainService.getProjectsByOrg(orgId),
        this.supplyChainService.getRequisitionsByOrg(orgId),
        this.supplyChainService.getPurchaseOrdersByOrg(orgId)
      ]);

      // Calculate stats
      this.stats.materials = materials.length;
      this.stats.suppliers = suppliers.length;
      this.stats.projects = projects.length;
      this.stats.requisitions = requisitions.length;
      this.stats.purchaseOrders = pos.length;
      this.stats.pendingRequisitions = requisitions.filter((r: any) => 
        r.status === 'Draft' || r.status === 'Submitted'
      ).length;
      this.stats.openPOs = pos.filter((po: any) => 
        po.status === 'Draft' || po.status === 'Sent' || po.status === 'Receiving'
      ).length;
      
      // Low stock materials (current stock <= min stock level)
      this.lowStockMaterials = materials
        .filter((m: any) => (m.currentStock || 0) <= m.minStockLevel)
        .slice(0, 5);
      this.stats.lowStockItems = materials.filter((m: any) => 
        (m.currentStock || 0) <= m.minStockLevel
      ).length;

      // Recent requisitions
      this.recentRequisitions = requisitions
        .sort((a: any, b: any) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bDate.getTime() - aDate.getTime();
        })
        .slice(0, 5);

      // Recent POs
      this.recentPOs = pos
        .sort((a: any, b: any) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bDate.getTime() - aDate.getTime();
        })
        .slice(0, 5);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Submitted': 'bg-blue-100 text-blue-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Sent': 'bg-indigo-100 text-indigo-800',
      'Acknowledged': 'bg-purple-100 text-purple-800',
      'Receiving': 'bg-yellow-100 text-yellow-800',
      'Closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
}
