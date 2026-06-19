import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageEmptyState, PageErrorState, PageListLoadingState } from '@/components/ui/page-states';
import { HighlightMetricCard } from '@/components/ui/highlight-metric-card';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { CrudListToolbar } from '@/components/crud/CrudListToolbar';
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
  MoreVertical,
  Calendar,
  DollarSign,
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
    return <PageListLoadingState />;
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
      <Card className="border-border/70 bg-card/90 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.16)]">
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Relacionamento
            </p>
            <p className="text-sm font-medium text-foreground">
              Acompanhe crescimento da base, recorrencia recente e potencial de receita por cliente.
            </p>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Use a busca para localizar nomes rapidamente e troque entre cards e lista conforme a tarefa do momento.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-background/80">
              {pagination.total} cliente(s)
            </Badge>
            <Badge variant="outline" className="bg-background/80">
              {viewMode === 'grid' ? 'Cards' : 'Lista'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <CrudListToolbar
        searchPlaceholder="Buscar clientes..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        gridAriaLabel="Visualizar clientes em cards"
        tableAriaLabel="Visualizar clientes em lista"
        actionLabel="Cliente"
        actionLabelMobile="Novo"
        actionLabelDesktop="Novo cliente"
        onAction={() => {
          setEditingClientId(null);
          setIsClientDialogOpen(true);
        }}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 sm:gap-4">
        <HighlightMetricCard
          title="Total de Clientes"
          value={String(pagination.total)}
          icon={Users}
          className="border-primary/20 bg-primary/8"
          titleClassName="text-primary"
          valueClassName="text-primary"
          iconContainerClassName="bg-primary/15"
          iconClassName="text-primary"
        />
        <HighlightMetricCard
          title="Ativos nesta pagina"
          value={String(activeClientsOnPage)}
          icon={Calendar}
          className="border-green-200/70 bg-green-50/70 dark:border-green-500/20 dark:bg-green-500/10"
          titleClassName="text-green-700 dark:text-green-300"
          valueClassName="text-green-800 dark:text-green-50"
          iconContainerClassName="bg-green-100 dark:bg-green-500/15"
          iconClassName="text-green-600 dark:text-green-300"
        />
        <HighlightMetricCard
          title="Faturamento na pagina"
          value={formatCurrency(totalSpentOnPage)}
          icon={DollarSign}
          className="border-indigo-200/70 bg-indigo-50/70 dark:border-indigo-500/20 dark:bg-indigo-500/10"
          titleClassName="text-indigo-700 dark:text-indigo-300"
          valueClassName="text-indigo-800 dark:text-indigo-50"
          iconContainerClassName="bg-indigo-100 dark:bg-indigo-500/15"
          iconClassName="text-indigo-600 dark:text-indigo-300"
        />
      </div>

      {filteredClients.length === 0 ? (
        <PageEmptyState
          title={searchTerm ? "Nenhum cliente encontrado para esta busca" : "Nenhum cliente cadastrado"}
          description={
            searchTerm
              ? "A busca atual nao retornou resultados. Limpe o termo para voltar a ver a lista completa."
              : "Cadastre o primeiro cliente para começar a organizar histórico, visitas e faturamento."
          }
          action={{
            label: searchTerm ? "Limpar busca" : "Novo cliente",
            onClick: () => {
              if (searchTerm) {
                setSearchTerm('');
                return;
              }
              setEditingClientId(null);
              setIsClientDialogOpen(true);
            },
            variant: searchTerm ? "outline" : "default",
          }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid gap-3 md:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
        <Card className="border-border/70 shadow-none">
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Abrir acoes do cliente ${client.name}`}
                          >
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
        <PaginationControls
          page={pagination.page}
          totalPages={totalPages}
          isLoading={isLoading}
          hasNextPage={pagination.hasMore}
          onPrevious={() => goToPage(pagination.page - 1)}
          onNext={() => goToPage(pagination.page + 1)}
        />
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
