#!/usr/bin/env node

/**
 * 🔐 Script de Preguntas de Seguridad
 * 
 * Inserta 40 preguntas de seguridad en la tabla 'preguntas'
 * Uso: node scripts/insert-security-questions.js
 */

const db = require('../config/db');

console.log('🔄 Iniciando inserción de preguntas de seguridad...\n');

// 40 preguntas de seguridad variadas
const preguntas = [
  { pregunta: '¿Cuál es el nombre de tu primera mascota?', categoria: 'personal' },
  { pregunta: '¿En qué ciudad naciste?', categoria: 'personal' },
  { pregunta: '¿Cuál es el nombre de tu madre?', categoria: 'familiar' },
  { pregunta: '¿Cuál es el nombre de tu padre?', categoria: 'familiar' },
  { pregunta: '¿Cuál es tu película favorita?', categoria: 'gustos' },
  { pregunta: '¿Cuál es tu canción favorita?', categoria: 'gustos' },
  { pregunta: '¿Cuál es tu comida favorita?', categoria: 'gustos' },
  { pregunta: '¿Cuál fue tu primera escuela?', categoria: 'educacion' },
  { pregunta: '¿Cuál es tu equipo de fútbol favorito?', categoria: 'gustos' },
  { pregunta: '¿En qué mes es tu cumpleaños?', categoria: 'personal' },
  { pregunta: '¿Cuál es el nombre de tu mejor amigo?', categoria: 'social' },
  { pregunta: '¿Cuál es tu número de documento favorito?', categoria: 'personal' },
  { pregunta: '¿Cuál fue tu primer trabajo?', categoria: 'laboral' },
  { pregunta: '¿En qué ciudad viviste durante tu infancia?', categoria: 'personal' },
  { pregunta: '¿Cuál es el nombre de tu hermano(a)?', categoria: 'familiar' },
  { pregunta: '¿Cuál es tu color favorito?', categoria: 'gustos' },
  { pregunta: '¿Cuál es tu deporte favorito?', categoria: 'gustos' },
  { pregunta: '¿En qué año te graduaste de la secundaria?', categoria: 'educacion' },
  { pregunta: '¿Cuál es el nombre de tu profesor favorito?', categoria: 'educacion' },
  { pregunta: '¿Cuál es la marca de tu automóvil?', categoria: 'posesiones' },
  { pregunta: '¿Cuál es tu libro favorito?', categoria: 'gustos' },
  { pregunta: '¿En qué año obtuviste tu licencia de conducir?', categoria: 'personal' },
  { pregunta: '¿Cuál es el nombre de tu abuelo(a) paterno?', categoria: 'familiar' },
  { pregunta: '¿Cuál es tu hobby favorito?', categoria: 'gustos' },
  { pregunta: '¿Cuál es el nombre de tu infancia?', categoria: 'personal' },
  { pregunta: '¿En qué ciudad estudiaste la universidad?', categoria: 'educacion' },
  { pregunta: '¿Cuál es tu restaurante favorito?', categoria: 'gustos' },
  { pregunta: '¿Cuál es tu actriz o actor favorito?', categoria: 'gustos' },
  { pregunta: '¿Cuál fue tu primera bicicleta?', categoria: 'posesiones' },
  { pregunta: '¿Cuál es tu marca de ropa favorita?', categoria: 'gustos' },
  { pregunta: '¿En qué calle viviste cuando eras niño?', categoria: 'personal' },
  { pregunta: '¿Cuál es el nombre de tu mascota actual?', categoria: 'personal' },
  { pregunta: '¿Cuál es tu aplicación móvil favorita?', categoria: 'tecnologia' },
  { pregunta: '¿Cuál es tu videojuego favorito?', categoria: 'gustos' },
  { pregunta: '¿En qué año compraste tu casa?', categoria: 'personal' },
  { pregunta: '¿Cuál es tu serie de TV favorita?', categoria: 'gustos' },
  { pregunta: '¿Cuál es el nombre de tu jefe actual?', categoria: 'laboral' },
  { pregunta: '¿Cuál es tu idioma favorito para aprender?', categoria: 'educacion' },
  { pregunta: '¿Cuál es tu plato tradicional favorito?', categoria: 'gustos' },
  { pregunta: '¿En qué ciudad pretendes vivir en el futuro?', categoria: 'personal' }
];

console.log(`📋 Total de preguntas a insertar: ${preguntas.length}\n`);

let insertados = 0;
let errores = 0;

// Insertar cada pregunta
preguntas.forEach((item, index) => {
  const sql = 'INSERT INTO preguntas (pregunta, categoria) VALUES (?, ?)';
  
  db.query(sql, [item.pregunta, item.categoria], (err, result) => {
    if (err) {
      console.error(`❌ Error en pregunta ${index + 1}: ${err.message}`);
      errores++;
    } else {
      insertados++;
      console.log(`✅ Pregunta ${index + 1} insertada: "${item.pregunta}"`);
    }
    
    // Si es la última, mostrar resumen
    if (index === preguntas.length - 1) {
      setTimeout(() => {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`📊 RESUMEN DE INSERCIÓN`);
        console.log(`${'='.repeat(70)}`);
        console.log(`✅ Preguntas insertadas exitosamente: ${insertados}`);
        console.log(`❌ Errores: ${errores}`);
        console.log(`📋 Total: ${preguntas.length}`);
        console.log(`${'='.repeat(70)}\n`);
        
        db.end();
        process.exit(errores > 0 ? 1 : 0);
      }, 500);
    }
  });
});
