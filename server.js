const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const path = require('path');

const app = express();
const upload = multer(); // Armazena o arquivo temporariamente na memória

app.use(express.json());
app.use(express.static('public')); // Para servirmos o HTML

// Configurações da sua API PHP Online
const PHP_API_BASE = 'https://seudominio/api/storage-api/public/api';

// Memória temporária para o Token (Em produção isso ficaria no DB ou Redis)
let bearerToken = "";

// 1. Rota inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 2. Cadastrar Usuário
app.post('/node-register', async (req, res) => {
    try {
        const response = await axios.post(`${PHP_API_BASE}/register`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || {error: 'Erro no Node'});
    }
});

// 3. Login e Captura de Token
app.post('/node-login', async (req, res) => {
    try {
        const response = await axios.post(`${PHP_API_BASE}/login`, req.body);
        console.log(response.data.access_token);
        if(response.data?.access_token) {
            bearerToken = response.data.access_token; // Salva na memória do servidor Node
            
        }
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || {error: 'Erro no Login'});
    }
});

// 4. Enviar Imagem (Aqui o Node atua como Proxy)
app.post('/node-upload', upload.single('image'), async (req, res) => {
    try {
        if (!bearerToken) return res.status(401).json({error: "Faça login primeiro no Node"});

        const form = new FormData();
        form.append('image', req.file.buffer, req.file.originalname);

        const response = await axios.post(`${PHP_API_BASE}/upload`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${bearerToken}`,
                'Accept': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || {error: 'Erro no Upload'});
    }
});

// 5. Listar Imagens
app.get('/node-list', async (req, res) => {
    try {
        const response = await axios.get(`${PHP_API_BASE}/images`, {
            headers: { 'Authorization': `Bearer ${bearerToken}`, 'Accept': 'application/json' }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || {error: 'Erro na lista'});
    }
});

// 5. Deletar Imagens
app.delete('/node-delete/:id', async (req, res) => {
    try {
        const response = await axios.delete(`${PHP_API_BASE}/image/${req.params.id}`, {
            headers: { 'Authorization': `Bearer ${bearerToken}`, 'Accept': 'application/json' }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || {error: 'Erro ao deletar imagem'});
    }
});



app.listen(3000, () => console.log('Servidor Node de teste rodando em http://localhost:3000'));