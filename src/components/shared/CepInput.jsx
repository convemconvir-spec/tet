import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function CepInput({ onAddressFound, defaultCep = '' }) {
  const [cep, setCep] = useState(defaultCep);
  const [loading, setLoading] = useState(false);

  const fetchCep = async (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 8) return;

    setLoading(true);
    try {
      // 1. busca endereço via ViaCEP
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const viaCep = await viaCepRes.json();

      if (viaCep.erro) {
        toast.error('CEP não encontrado');
        setLoading(false);
        return;
      }

      // 2. geocodifica via Nominatim
      const query = encodeURIComponent(`${viaCep.logradouro}, ${viaCep.bairro}, ${viaCep.localidade}, ${viaCep.uf}, Brasil`);
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
      const geo = await geoRes.json();

      const lat = geo[0] ? parseFloat(geo[0].lat) : null;
      const lng = geo[0] ? parseFloat(geo[0].lon) : null;

      onAddressFound({
        address: `${viaCep.logradouro}, ${viaCep.bairro}`,
        city: viaCep.localidade,
        state: viaCep.uf,
        cep: cleaned,
        latitude: lat,
        longitude: lng,
      });

      if (lat && lng) {
        toast.success('Endereço e localização encontrados!');
      } else {
        toast.success('Endereço preenchido (localização aproximada)');
      }
    } catch (err) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 8);
    // format as 00000-000
    if (val.length > 5) val = val.slice(0, 5) + '-' + val.slice(5);
    setCep(val);
    if (val.replace(/\D/g, '').length === 8) fetchCep(val);
  };

  return (
    <div className="relative">
      <Label>CEP</Label>
      <div className="relative">
        <Input
          name="cep"
          value={cep}
          onChange={handleChange}
          placeholder="00000-000"
          maxLength={9}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            : <MapPin className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </div>
    </div>
  );
}