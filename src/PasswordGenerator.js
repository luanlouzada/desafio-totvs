import React, { useState } from 'react';
import axios from 'axios';

function PasswordGenerator() {
    const [password, setPassword] = useState('');
    const [views, setViews] = useState(0);
    const [days, setDays] = useState(0);    
    const [error, setError] = useState('');
    const [generatedPasswordId, setGeneratedPasswordId] = useState(null);
  
    const API_URL = 'https://905rvzdjn9.execute-api.us-east-2.amazonaws.com/prod/password';
  
    const generatePassword = async () => {
        const randomString = Math.random().toString(36).substr(2, 8);
        const encoder = new TextEncoder();
        const data = encoder.encode(randomString);
        const hash = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    
        const specialChars = "!@#$%^&*()_+<>?";
        const randomSpecialChar = specialChars[Math.floor(Math.random() * specialChars.length)];
    
        const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const randomUppercaseChar = uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
    
        setPassword(hashHex + randomSpecialChar + randomUppercaseChar);
    };
    
    const isValidPassword = (pwd) => {
        const hasUpperCase = /[A-Z]/.test(pwd);
        const hasNumber = /[0-9]/.test(pwd);
        const hasSpecialChar = /[!@#$%^&*()_+<>?]/.test(pwd);
        return pwd.length >= 8 && hasUpperCase && hasNumber && hasSpecialChar;
    };
    
    const createSecureLink = () => {
        if (!isValidPassword(password)) {
            setError("A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, um número e um caractere especial.");
            return;
        }
    
        if (views < 1 || !Number.isInteger(Number(views))) {
            setError("Número de visualizações deve ser um número inteiro maior ou igual a 1.");
            return;
        }
    
        if (days < 1 || !Number.isInteger(Number(days))) {
            setError("Validade (em dias) deve ser um número inteiro maior ou igual a 1.");
            return;
        }
    
        setError('');
    
        const passwordData = {
            password,
            views,
            days
        };

        axios.post(API_URL, passwordData)
        .then(response => {
            const passwordId = response.data.passwordId;
            setGeneratedPasswordId(passwordId);
        })
        .catch(error => {
            console.error("Ops! Tive um problema ao tentar criar o link seguro:", error);
        });
    };

    return (
        <div className="container password-generator">
            <h2>Gerador de Senha Segura</h2>
            <input 
                className="input-field"
                type="text" 
                placeholder="Digite sua senha" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
            />
            {error && <p className="error-message">{error}</p>}
            <p>OU</p>
            <button className="generate-button" onClick={generatePassword}>Gerar Senha Aleatória</button>
            <div className="input-group">
                <label>
                    Número de visualizações:
                    <input 
                        type="number" 
                        value={views} 
                        onChange={(e) => setViews(e.target.value)} 
                    />
                </label>
                <label>
                    Validade (em dias):
                    <input 
                        type="number" 
                        value={days} 
                        onChange={(e) => setDays(e.target.value)} 
                    />
                </label>
            </div>
            <button className="create-link-button" onClick={createSecureLink}>
                Criar Link Seguro
            </button>
            {generatedPasswordId && (
                <>
                    <p>Link gerado:</p>
                    <input 
                        type="text" 
                        readOnly 
                        value={`${window.location.origin}/display-password/${generatedPasswordId}`} 
                        id="generatedLink"
                    />
                    <button onClick={() => {
                        const copyText = document.getElementById("generatedLink");
                        copyText.select();
                        document.execCommand("copy");
                        alert("Link copiado!");
                    }}>
                        Copiar Link
                    </button>
                </>
            )}
        </div>
    );    
}

export default PasswordGenerator;
