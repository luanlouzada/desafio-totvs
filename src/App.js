import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DisplayPassword from './DisplayPassword';
import PasswordGenerator from './PasswordGenerator';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <h1>Gerador de Senha Segura</h1>

        <Routes>
          <Route path="/" element={<PasswordGenerator />} />
          <Route path="/display-password/:passwordId" element={<DisplayPassword />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;