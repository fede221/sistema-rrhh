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
  '¿Cuál es el nombre de tu primera mascota?',
  '¿En qué ciudad naciste?',
  '¿Cuál es el nombre de tu madre?',
  '¿Cuál es el nombre de tu padre?',
  '¿Cuál es tu película favorita?',
  '¿Cuál es tu canción favorita?',
  '¿Cuál es tu comida favorita?',
  '¿Cuál fue tu primera escuela?',
  '¿Cuál es tu equipo de fútbol favorito?',
  '¿En qué mes es tu cumpleaños?',
  '¿Cuál es el nombre de tu mejor amigo?',
  '¿Cuál fue tu primer trabajo?',
  '¿En qué ciudad viviste durante tu infancia?',
  '¿Cuál es el nombre de tu hermano(a)?',
  '¿Cuál es tu color favorito?',
  '¿Cuál es tu deporte favorito?',
  '¿En qué año te graduaste de la secundaria?',
  '¿Cuál es el nombre de tu profesor favorito?',
  '¿Cuál es la marca de tu automóvil?',
  '¿Cuál es tu libro favorito?',
  '¿En qué año obtuviste tu licencia de conducir?',
  '¿Cuál es el nombre de tu abuelo(a) paterno?',
  '¿Cuál es tu hobby favorito?',
  '¿En qué ciudad estudiaste la universidad?',
  '¿Cuál es tu restaurante favorito?',
  '¿Cuál es tu actriz o actor favorito?',
  '¿Cuál fue tu primera bicicleta?',
  '¿Cuál es tu marca de ropa favorita?',
  '¿En qué calle viviste cuando eras niño?',
  '¿Cuál es el nombre de tu mascota actual?',
  '¿Cuál es tu aplicación móvil favorita?',
  '¿Cuál es tu videojuego favorito?',
  '¿En qué año compraste tu casa?',
  '¿Cuál es tu serie de TV favorita?',
  '¿Cuál es el nombre de tu jefe actual?',
  '¿Cuál es tu idioma favorito para aprender?',
  '¿Cuál es tu plato tradicional favorito?',
  '¿En qué ciudad pretendes vivir en el futuro?',
  '¿Cuál es tu red social favorita?',
  '¿Cuál fue tu primer amor?'
];

console.log(`📋 Total de preguntas a insertar: ${preguntas.length}\n`);

let insertados = 0;
let errores = 0;

// Insertar cada pregunta
preguntas.forEach((pregunta, index) => {
  const sql = 'INSERT INTO preguntas (pregunta) VALUES (?)';
  
  db.query(sql, [pregunta], (err, result) => {
    if (err) {
      console.error(`❌ Error en pregunta ${index + 1}: ${err.message}`);
      errores++;
    } else {
      insertados++;
      console.log(`✅ Pregunta ${index + 1} insertada: "${pregunta}"`);
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
