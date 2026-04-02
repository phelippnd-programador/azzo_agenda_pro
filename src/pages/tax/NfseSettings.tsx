import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  ApiError,
  nfseApi,
  type NfseConfig,
  type NfseFiscalMunicipality,
  type NfseFiscalState,
  type NfseProviderCapabilities,
} from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { NfseConfigCard } from "@/components/nfse/NfseConfigCard";
import { NfseCapabilityCard } from "@/components/nfse/NfseCapabilityCard";
import { toast } from "sonner";

const DEFAULT_CONFIG: NfseConfig = {
  ambiente: "HOMOLOGACAO",
  municipioCodigoIbge: "",
  provedor: "MOCK_NACIONAL",
  serieRps: "A1",
  aliquotaIssPadrao: 5,
  itemListaServicoPadrao: "1.01",
  emissionMode: "ASK_ON_CLOSE",
  emitForCpfMode: "ASK",
  autoIssueOnAppointmentClose: false,
};

const DEFAULT_CAP: NfseProviderCapabilities = {
  municipioCodigoIbge: "",
  provedor: "MOCK_NACIONAL",
  layoutVersion: "2.04",
  cancelSupported: true,
  cancelWindowHours: 24,
  cancelMode: "SYNC",
};

export default function NfseSettings() {
  const [config, setConfig] = useState<NfseConfig>(DEFAULT_CONFIG);
  const [capability, setCapability] = useState<NfseProviderCapabilities>(DEFAULT_CAP);
  const [capabilities, setCapabilities] = useState<NfseProviderCapabilities[]>([]);
  const [states, setStates] = useState<NfseFiscalState[]>([]);
  const [configStateUf, setConfigStateUf] = useState("");
  const [capabilityStateUf, setCapabilityStateUf] = useState("");
  const [configMunicipalities, setConfigMunicipalities] = useState<NfseFiscalMunicipality[]>([]);
  const [capabilityMunicipalities, setCapabilityMunicipalities] = useState<NfseFiscalMunicipality[]>([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingCap, setIsSavingCap] = useState(false);
  const [isConfigUnconfigured, setIsConfigUnconfigured] = useState(false);

  const showError = (error: unknown, fallbackMessage: string) => {
    const uiError = resolveUiError(error, fallbackMessage);
    toast.error(uiError.code ? `[${uiError.code}] ${uiError.message}` : uiError.message);
  };

  const selectedConfigMunicipality = useMemo(
    () =>
      configMunicipalities.find((item) => item.codigoIbge === config.municipioCodigoIbge) || null,
    [configMunicipalities, config.municipioCodigoIbge],
  );

  const selectedCapabilityMunicipality = useMemo(
    () =>
      capabilityMunicipalities.find(
        (item) => item.codigoIbge === capability.municipioCodigoIbge,
      ) || null,
    [capabilityMunicipalities, capability.municipioCodigoIbge],
  );

  const loadStates = async () => {
    try {
      const response = await nfseApi.listStates();
      setStates(response);
    } catch {
      setStates([]);
    }
  };

  const loadMunicipalities = async (
    stateUf: string,
    target: "config" | "capability",
    preferredCodigoIbge?: string,
  ) => {
    if (!stateUf) {
      if (target === "config") setConfigMunicipalities([]);
      else setCapabilityMunicipalities([]);
      return;
    }
    try {
      const response = await nfseApi.listMunicipalities({ stateUf, limit: 1000 });
      if (target === "config") {
        setConfigMunicipalities(response);
        if (
          preferredCodigoIbge &&
          response.some((item) => item.codigoIbge === preferredCodigoIbge)
        ) {
          setConfig((prev) => ({ ...prev, municipioCodigoIbge: preferredCodigoIbge }));
        }
      } else {
        setCapabilityMunicipalities(response);
        if (
          preferredCodigoIbge &&
          response.some((item) => item.codigoIbge === preferredCodigoIbge)
        ) {
          setCapability((prev) => ({ ...prev, municipioCodigoIbge: preferredCodigoIbge }));
        }
      }
    } catch {
      if (target === "config") setConfigMunicipalities([]);
      else setCapabilityMunicipalities([]);
    }
  };

  const loadConfig = async (ambiente: "HOMOLOGACAO" | "PRODUCAO") => {
    try {
      const response = await nfseApi.getConfig(ambiente);
      setConfig(response);
      setIsConfigUnconfigured(false);
      const derivedStateCodigo = response.municipioCodigoIbge?.slice(0, 2) || "";
      const derivedState = states.find((item) => item.codigoIbge === derivedStateCodigo);
      const derivedUf = derivedState?.uf || "";
      setConfigStateUf(derivedUf);
      if (derivedUf) {
        await loadMunicipalities(derivedUf, "config", response.municipioCodigoIbge);
      } else {
        setConfigMunicipalities([]);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setIsConfigUnconfigured(true);
      }
      setConfig((prev) => ({ ...prev, ambiente, municipioCodigoIbge: "" }));
      setConfigStateUf("");
      setConfigMunicipalities([]);
    }
  };

  const loadCapabilities = async () => {
    try {
      const response = await nfseApi.listProviderCapabilities();
      setCapabilities(response);
    } catch {
      setCapabilities([]);
    }
  };

  useEffect(() => {
    void loadStates();
    void loadCapabilities();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (states.length === 0) return;
    void loadConfig("HOMOLOGACAO");
  }, [states]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveConfig = async () => {
    try {
      setIsSavingConfig(true);
      const saved = await nfseApi.saveConfig(config);
      setConfig(saved);
      setIsConfigUnconfigured(false);
      toast.success("Configuracao NFS-e salva com sucesso.");
    } catch (error) {
      showError(error, "Erro ao salvar configuracao NFS-e");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSaveCapability = async () => {
    try {
      setIsSavingCap(true);
      await nfseApi.saveProviderCapabilities(capability);
      toast.success("Capacidade de provedor salva.");
      await loadCapabilities();
    } catch (error) {
      showError(error, "Erro ao salvar capacidade de provedor");
    } finally {
      setIsSavingCap(false);
    }
  };

  return (
    <MainLayout
      title="Configuracoes NFS-e"
      subtitle="Parametros por ambiente e capacidades de provedor por municipio."
    >
      <div className="space-y-6">
        <NfseConfigCard
          config={config}
          configStateUf={configStateUf}
          configMunicipalities={configMunicipalities}
          states={states}
          selectedMunicipality={selectedConfigMunicipality}
          isConfigUnconfigured={isConfigUnconfigured}
          isSaving={isSavingConfig}
          onConfigChange={(update) => setConfig((prev) => ({ ...prev, ...update }))}
          onStateUfChange={(uf) => {
            setConfigStateUf(uf);
            void loadMunicipalities(uf, "config");
          }}
          onLoadConfig={(ambiente) => void loadConfig(ambiente)}
          onSave={() => void handleSaveConfig()}
        />

        <NfseCapabilityCard
          capability={capability}
          capabilityStateUf={capabilityStateUf}
          capabilityMunicipalities={capabilityMunicipalities}
          capabilities={capabilities}
          states={states}
          selectedMunicipality={selectedCapabilityMunicipality}
          isSaving={isSavingCap}
          onCapabilityChange={(update) => setCapability((prev) => ({ ...prev, ...update }))}
          onStateUfChange={(uf) => {
            setCapabilityStateUf(uf);
            void loadMunicipalities(uf, "capability");
          }}
          onSave={() => void handleSaveCapability()}
        />
      </div>
    </MainLayout>
  );
}
