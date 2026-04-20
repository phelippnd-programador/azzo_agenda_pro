import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PageErrorState } from '@/components/ui/page-states';
import { HighlightMetricCard } from '@/components/ui/highlight-metric-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Calendar,
  DollarSign,
  Grid3X3,
  List,
  Users,
} from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';
import { ClientCard } from '@/components/clients/ClientCard';
import { ClientUpsertDialog } from '@/components/clients/ClientUpsertDialog';
import { resolveApiMediaUrl } from '@/lib/api';
import { maskPhoneBr } from '@/lib/input-masks';
import { formatCurrency } from '@/lib/format';

export default function ClientsOverviewPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  const { clients, pagination, isLoading, error, refetch, goToPage, createClient, updateClient, deleteClient } = useClients();
  const activeClientsOnPage = clients.filter(
    (client) => client.lastVisit && new Date(client.lastVisit) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;
  const totalSpentOnPage = clients.reduce((sum, client) => sum + client.totalSpent, 0);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const editingClient = editingClientId ? clients.find((client) => client.id === editingClientId) ?? null : null;

  const openEditDialog = (client: typeof clients[number]) => {
    setEditingClientId(client.id);
    setIsClientDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setClientToDelete(id);
  };

  const openProfilePage = (id: string) => {
    navigate(`/clientes/${id}`);
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    setIsDeletingClient(true);
    try {
      await deleteClient(clientToDelete);
      setClientToDelete(null);
    } catch (error) {
      // handled in hook
    } finally {
      setIsDeletingClient(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <PageErrorState
        title="Nao foi possivel carregar os clientes"
        description={error}
        action={{ label: 'Tentar novamente', onClick: refetch }}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex overflow-hidden rounded-lg border">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 rounded-none sm:h-9 sm:w-9"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('table')}
              className="h-8 w-8 rounded-none sm:h-9 sm:w-9"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button
            className="gap-2"
            onClick={() => {
              setEditingClientId(null);
              setIsClientDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo</span> Cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <HighlightMetricCard
          title="Total de Clientes"
          value={String(pagination.total)}
          icon={Users}
          className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5"
          titleClassName="text-primary"
          valueClassName="text-primary"
          iconContainerClassName="bg-primary/15"
          iconClassName="text-primary"
        />
        <HighlightMetricCard
          title="Ativos nesta pagina"
          value={String(activeClientsOnPage)}
          icon={Calendar}
          className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
          titleClassName="text-green-700"
          valueClassName="text-green-800"
          iconContainerClassName="bg-green-100"
          iconClassName="text-green-600"
        />
        <HighlightMetricCard
          title="Faturamento na pagina"
          value={formatCurrency(totalSpentOnPage)}
          icon={DollarSign}
          className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50"
          titleClassName="text-indigo-700"
          valueClassName="text-indigo-800"
          iconContainerClassName="bg-indigo-100"
          iconClassName="text-indigo-600"
        />
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum cliente encontrado</p>
            {searchTerm ? (
              <Button variant="link" onClick={() => setSearchTerm('')}>
                Limpar busca
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onOpenProfile={openProfilePage}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
            />
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
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={resolveApiMediaUrl(client.avatarUrl) || undefined} />
                          <AvatarFallback className="bg-primary/15 text-xs text-primary">
                            {client.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="max-w-[120px] truncate text-sm font-medium sm:max-w-none">
                            {client.name}
                          </p>
                          <p className="text-xs text-muted-foreground sm:hidden">{maskPhoneBr(client.phone, false)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm sm:table-cell">{maskPhoneBr(client.phone, false)}</TableCell>
                    <TableCell className="hidden max-w-[150px] truncate text-sm md:table-cell">
                      {client.email || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {client.totalVisits}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-primary">
                      {formatCurrency(client.totalSpent)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(client)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openProfilePage(client.id)}>
                            Ver Historico
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => openDeleteDialog(client.id)}
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
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
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

      <ClientUpsertDialog
        open={isClientDialogOpen}
        onOpenChange={(open) => {
          setIsClientDialogOpen(open);
          if (!open) setEditingClientId(null);
        }}
        initialClient={editingClient}
        onSubmit={(payload, clientId) => (clientId ? updateClient(clientId, payload) : createClient(payload))}
      />

      <DeleteConfirmationDialog
        open={!!clientToDelete}
        isLoading={isDeletingClient}
        title="Excluir cliente?"
        description="Tem certeza que deseja excluir este cliente? Esta acao nao pode ser desfeita."
        onOpenChange={(open) => {
          if (isDeletingClient) return;
          if (!open) setClientToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
