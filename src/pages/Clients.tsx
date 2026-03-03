import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PageErrorState } from '@/components/ui/page-states';
import { HighlightMetricCard } from '@/components/ui/highlight-metric-card';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreVertical,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Grid3X3,
  List,
  Users,
  Loader2,
} from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { maskPhoneBr } from '@/lib/input-masks';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const { clients, pagination, isLoading, error, refetch, goToPage, createClient, updateClient, deleteClient } = useClients();

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormBirthDate('');
    setFormNotes('');
    setEditingClient(null);
  };

  const openEditDialog = (client: typeof clients[0]) => {
    setFormName(client.name);
    setFormEmail(client.email);
    setFormPhone(client.phone);
    setFormBirthDate(client.birthDate || '');
    setFormNotes(client.notes || '');
    setEditingClient(client.id);
    setIsNewClientOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName || !formPhone) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      const clientData = {
        name: formName,
        email: formEmail,
        phone: formPhone,
        birthDate: formBirthDate || undefined,
        notes: formNotes || undefined,
      };

      if (editingClient) {
        await updateClient(editingClient, clientData);
      } else {
        await createClient(clientData);
      }

      setIsNewClientOpen(false);
      resetForm();
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteClient(id);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Clientes" subtitle="Gerencie sua base de clientes">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Clientes" subtitle="Gerencie sua base de clientes">
        <PageErrorState
          title="Nao foi possivel carregar os clientes"
          description={error}
          action={{ label: 'Tentar novamente', onClick: refetch }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Clientes" subtitle="Gerencie sua base de clientes">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-none h-8 w-8 sm:h-9 sm:w-9"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('table')}
                className="rounded-none h-8 w-8 sm:h-9 sm:w-9"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Dialog open={isNewClientOpen} onOpenChange={(open) => {
              setIsNewClientOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Novo</span> Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
                  <DialogDescription>
                    {editingClient ? 'Atualize os dados do cliente' : 'Cadastre um novo cliente'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input
                      placeholder="Nome do cliente"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telefone *</Label>
                      <Input
                        placeholder="(11) 99999-0000"
                        value={formPhone}
                        onChange={(e) => setFormPhone(maskPhoneBr(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Nascimento</Label>
                    <Input
                      type="date"
                      value={formBirthDate}
                      onChange={(e) => setFormBirthDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      placeholder="Preferências, alergias, etc."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsNewClientOpen(false);
                    resetForm();
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingClient ? 'Salvando...' : 'Cadastrando...'}
                      </>
                    ) : (
                      editingClient ? 'Salvar' : 'Cadastrar'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <HighlightMetricCard
            title="Total de Clientes"
            value={String(pagination.total)}
            icon={Users}
            className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
            titleClassName="text-primary"
            valueClassName="text-primary"
            iconContainerClassName="bg-primary/15"
            iconClassName="text-primary"
          />
          <HighlightMetricCard
            title="Ativos (30 dias)"
            value={String(
              clients.filter(
                (c) => c.lastVisit && new Date(c.lastVisit) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              ).length
            )}
            icon={Calendar}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
            titleClassName="text-green-700"
            valueClassName="text-green-800"
            iconContainerClassName="bg-green-100"
            iconClassName="text-green-600"
          />
          <HighlightMetricCard
            title="Faturamento Total"
            value={formatCurrency(clients.reduce((sum, c) => sum + c.totalSpent, 0))}
            icon={DollarSign}
            className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200"
            titleClassName="text-indigo-700"
            valueClassName="text-indigo-800"
            iconContainerClassName="bg-indigo-100"
            iconClassName="text-indigo-600"
          />
        </div>

        {/* Clients List */}
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum cliente encontrado</p>
              {searchTerm && (
                <Button variant="link" onClick={() => setSearchTerm('')}>
                  Limpar busca
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                        <AvatarFallback className="bg-primary/15 text-primary text-sm">
                          {client.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                          {client.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {client.totalVisits} visitas
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(client)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>Ver Histórico</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(client.id)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{client.phone}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm truncate">{client.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[10px] sm:text-xs">Última visita</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium">
                        {client.lastVisit
                          ? new Date(client.lastVisit).toLocaleDateString('pt-BR')
                          : 'Nunca'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <DollarSign className="w-3 h-3" />
                        <span className="text-[10px] sm:text-xs">Total gasto</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-primary">
                        {formatCurrency(client.totalSpent)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                    <TableHead className="hidden md:table-cell">E-mail</TableHead>
                    <TableHead className="text-center">Visitas</TableHead>
                    <TableHead className="text-right">Total Gasto</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className="bg-primary/15 text-primary text-xs">
                              {client.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">
                              {client.name}
                            </p>
                            <p className="text-xs text-muted-foreground sm:hidden">{client.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{client.phone}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm truncate max-w-[150px]">
                        {client.email || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {client.totalVisits}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary text-sm">
                        {formatCurrency(client.totalSpent)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(client)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>Ver Histórico</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(client.id)}
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {!searchTerm && totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3 border rounded-lg p-3 bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Pagina {pagination.page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1 || isLoading}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= totalPages || isLoading || !pagination.hasMore}
              >
                Proxima
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}
