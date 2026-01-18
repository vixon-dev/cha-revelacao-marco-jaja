const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'votos.json');

app.use(express.json());
app.use(express.static('public'));

// Carregar votos do arquivo
function carregarVotos() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar votos:', error);
  }
  return [];
}

// Salvar votos no arquivo
function salvarVotos(votos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(votos, null, 2));
}

// Normalizar nome para comparacao
function normalizarNome(nome) {
  return nome.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// GET - Listar todos os votos
app.get('/api/votos', (req, res) => {
  const votos = carregarVotos();
  const estatisticas = {
    total: votos.length,
    menino: votos.filter(v => v.escolha === 'menino').length,
    menina: votos.filter(v => v.escolha === 'menina').length
  };
  res.json({ votos, estatisticas });
});

// POST - Registrar novo voto
app.post('/api/votos', (req, res) => {
  const { nome, escolha } = req.body;
  
  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'Nome e obrigatorio!' });
  }
  
  if (!escolha || !['menino', 'menina'].includes(escolha)) {
    return res.status(400).json({ erro: 'Escolha deve ser menino ou menina!' });
  }
  
  const votos = carregarVotos();
  const nomeNormalizado = normalizarNome(nome);
  
  // Verificar voto duplicado
  const votoDuplicado = votos.find(v => normalizarNome(v.nome) === nomeNormalizado);
  if (votoDuplicado) {
    return res.status(400).json({ erro: 'Voce ja votou! Cada pessoa so pode votar uma vez.' });
  }
  
  const novoVoto = {
    id: Date.now(),
    nome: nome.trim(),
    escolha,
    dataHora: new Date().toISOString()
  };
  
  votos.push(novoVoto);
  salvarVotos(votos);
  
  res.status(201).json({ sucesso: true, voto: novoVoto });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
