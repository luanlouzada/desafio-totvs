import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // Mantendo a senha inserida pelo usuário ou a gerada automaticamente
  const [password, setPassword] = useState('');

  // Mantendo o número de visualizações que o usuário definiu
  const [views, setViews] = useState(0);

  // Mantendo a duração em dias que o usuário definiu para a senha
  const [days, setDays] = useState(0);

  // Minha URL base da API. Preciso lembrar de substituir pela URL real do API Gateway quando estiver pronto.
  const API_URL = 'https://905rvzdjn9.execute-api.us-east-2.amazonaws.com/prod';

  // Função para gerar uma senha aleatória. Estou usando SHA-256 para torná-la segura.
  const generatePassword = async () => {
    const randomString = Math.random().toString(36).substr(2, 8);
    const encoder = new TextEncoder();
    const data = encoder.encode(randomString);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    setPassword(hashHex);
  };

  // Função para criar um link seguro. Aqui estou enviando os dados para minha API.
  const createSecureLink = () => {
    const passwordData = {
      password,
      views,
      days
    };

    axios.post(API_URL, passwordData)
      .then(response => {
        // A API deve retornar a URL gerada ou alguma informação relevante. Vou manter isso aqui para referência futura.
        console.log(response.data);
      })
      .catch(error => {
        console.error("Ops! Tive um problema ao tentar criar o link seguro:", error);
      });
  };

  return (
    <div className="App">
      <h1>Gerador de Senha Segura</h1>

      {/* Campo para o usuário inserir sua própria senha */}
      <input 
        type="text" 
        placeholder="Digite sua senha" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />

      <p>OU</p>

      {/* Botão para o usuário gerar uma senha aleatória */}
      <button onClick={generatePassword}>Gerar Senha Aleatória</button>

      {/* Campo para o usuário definir quantas vezes a senha pode ser visualizada */}
      <label>
        Número de visualizações:
        <input 
          type="number" 
          value={views} 
          onChange={(e) => setViews(e.target.value)} 
        />
      </label>

      {/* Campo para o usuário definir por quantos dias a senha será válida */}
      <label>
        Validade (em dias):
        <input 
          type="number" 
          value={days} 
          onChange={(e) => setDays(e.target.value)} 
        />
      </label>

      {/* Botão para enviar os dados para a API e obter o link seguro */}
      <button onClick={createSecureLink}>
        Criar Link Seguro
      </button>
    </div>
  );
}

export default App;
