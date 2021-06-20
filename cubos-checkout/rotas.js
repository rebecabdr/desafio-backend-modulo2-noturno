const express = require('express');
const controladorProdutos = require("./controladores/produtos")

const roteador = express();

roteador.get('/produtos', controladorProdutos.listarProdutos);
roteador.get('/carrinho', controladorProdutos.listarCarrinho);
roteador.post('/carrinho/produtos', controladorProdutos.adicionarCarrinho);
roteador.patch('/carrinho/produtos/:idProduto', controladorProdutos.alterarCarrinho);
roteador.delete('/carrinho/produtos/:idProduto', controladorProdutos.deletarProdutoCarrinho);
roteador.delete('/carrinho', controladorProdutos.deletarCarrinho);
roteador.post('/carrinho/finalizar-compra', controladorProdutos.finalizarCompra);

module.exports = roteador;
