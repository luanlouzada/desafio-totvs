import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function DisplayPassword() {
  const { passwordId } = useParams();
  const [data, setData] = useState(null);
  const [expiryDate, setExpiryDate] = useState(null);
  const [viewsRemaining, setViewsRemaining] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    axios.get(`https://905rvzdjn9.execute-api.us-east-2.amazonaws.com/prod/password?pass=${passwordId}`)
    .then(response => {
        const { password, expiryDate, viewsRemaining } = response.data;
        setData({ password });
        setExpiryDate(new Date(expiryDate * 1000).toLocaleDateString());
        setViewsRemaining(viewsRemaining - 1); // Subtrair 1 da contagem de visualizações restantes
        if (viewsRemaining <= 0) { // Se for 1, significa que esta é a última visualização permitida
          setLoadingStatus('limitReached');
        } else {
          setLoadingStatus('success');
        }
    })
    .catch(error => {
        setErrorMessage('Ou esse link não existe ou a sua senha expirou');
        setLoadingStatus('error');
    });
  }, [passwordId]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    setTimeout(() => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }, 15000); // 15 segundos

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <div className="container">
        <h2>Sua Senha Segura</h2>
        {loadingStatus === 'loading' && <p>Carregando...</p>}
        {loadingStatus === 'success' && (
          <>
            <p>Senha: {data.password}</p>
            <p>Visualizações restantes: {viewsRemaining}</p>
            <p>Data de Expiração: {expiryDate}</p>
          </>
        )}
        {loadingStatus === 'limitReached' && <p>O limite de visualizações desta senha foi atingido.</p>}
        {loadingStatus === 'error' && <p>{errorMessage}</p>}
    </div>
  );
}

export default DisplayPassword;
