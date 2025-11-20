import React, { useState, useMemo, useEffect } from 'react';
import { Invoice } from '../types';
import { Search, ChevronDown, ChevronRight, CheckCircle2, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { cn } from '../utils/cn';

interface ReviewTableProps {
  invoices: Invoice[];
  onSave: (updatedInvoices: Invoice[]) => void;
}

const ReviewTable: React.FC<ReviewTableProps> = ({ invoices, onSave }) => {
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>(invoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'monofasico' | 'tributado' | 'pending_review'>('all');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when invoices prop changes
  useEffect(() => {
    setLocalInvoices(invoices);
    setHasChanges(false);
  }, [invoices]);

  const toggleItemStatus = (invoiceId: string, itemId: number) => {
    const updatedInvoices = localInvoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          items: inv.items.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                is_monofasico: !item.is_monofasico,
                manual_override: true,
                human_reviewed: true // Changing status implies review
              };
            }
            return item;
          })
        };
      }
      return inv;
    });
    setLocalInvoices(updatedInvoices);
    setHasChanges(true);
  };

  const confirmItemReview = (invoiceId: string, itemId: number) => {
    const updatedInvoices = localInvoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          items: inv.items.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                human_reviewed: true
              };
            }
            return item;
          })
        };
      }
      return inv;
    });
    setLocalInvoices(updatedInvoices);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(localInvoices);
    setHasChanges(false);
  };

  const filteredInvoices = useMemo(() => {
    return localInvoices.filter(inv => {
      const matchesSearch = inv.access_key.includes(searchTerm) ||
        inv.items.some(item => item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterStatus === 'all') return true;
      if (filterStatus === 'pending_review') return inv.items.some(i => !i.human_reviewed);

      // Check if invoice has any item matching the status
      return inv.items.some(item =>
        (filterStatus === 'monofasico' && item.is_monofasico) ||
        (filterStatus === 'tributado' && !item.is_monofasico)
      );
    });
  }, [localInvoices, searchTerm, filterStatus]);

  const toggleInvoice = (id: string) => {
    setExpandedInvoiceId(expandedInvoiceId === id ? null : id);
  };

  const totalPendingReview = localInvoices.reduce((acc, inv) =>
    acc + inv.items.filter(i => !i.human_reviewed).length, 0
  );

  return (
    <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-primary">Revisão Fiscal Detalhada</CardTitle>
            {totalPendingReview > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {totalPendingReview} {totalPendingReview === 1 ? 'item pendente' : 'itens pendentes'} de revisão
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por chave ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">Todos os Status</option>
              <option value="pending_review">Pendente de Revisão</option>
              <option value="monofasico">Contém Monofásico</option>
              <option value="tributado">Contém Tributado</option>
            </select>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar Revisão
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredInvoices.map(invoice => (
            <div key={invoice.id} className="border rounded-lg overflow-hidden bg-card transition-all duration-200 hover:shadow-md">
              <div
                className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50"
                onClick={() => toggleInvoice(invoice.id)}
              >
                <div className="flex items-center gap-4">
                  {expandedInvoiceId === invoice.id ? <ChevronDown className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <p className="font-medium text-foreground">{invoice.access_key}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.issue_date).toLocaleDateString('pt-BR')} • {invoice.items.length} itens
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right mr-4">
                    <p className="text-sm font-medium text-foreground">
                      {invoice.items.filter(i => i.is_monofasico).length} Monofásicos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.items.filter(i => !i.human_reviewed).length} Pendentes de Revisão
                    </p>
                  </div>
                </div>
              </div>

              {expandedInvoiceId === invoice.id && (
                <div className="border-t animate-in slide-in-from-top-2 duration-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 font-medium">Produto</th>
                          <th className="px-4 py-3 font-medium">NCM</th>
                          <th className="px-4 py-3 font-medium">Valor</th>
                          <th className="px-4 py-3 font-medium text-center">Classificação (Clique para alterar)</th>
                          <th className="px-4 py-3 font-medium text-center">Revisão Humana</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {invoice.items.map(item => (
                          <tr key={item.id} className={cn(
                            "hover:bg-muted/20 transition-colors",
                            item.manual_override && "bg-blue-50/50"
                          )}>
                            <td className="px-4 py-3 font-medium text-foreground max-w-[300px] truncate" title={item.description}>
                              {item.description}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{item.ncm_code}</td>
                            <td className="px-4 py-3 text-foreground">
                              {item.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={item.is_monofasico}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleItemStatus(invoice.id, item.id);
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                                <span className={cn(
                                  "text-xs font-medium",
                                  item.is_monofasico ? "text-green-600" : "text-gray-500"
                                )}>
                                  {item.is_monofasico ? "Monofásico" : "Tributado"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.human_reviewed ? (
                                <div className="flex items-center justify-center text-green-600 gap-1">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="text-xs font-medium">Verificado</span>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-dashed border-primary/50 text-primary hover:bg-primary/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmItemReview(invoice.id, item.id);
                                  }}
                                >
                                  Confirmar
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewTable;