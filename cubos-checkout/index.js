const express = require('express');
const data = require('./banco/data.json');
const bodyParser = require('body-parser');

const app = express();

app.use(express.json());


// GET listar produtos, com filtros ou sem.

app.get('/produtos', (req, res) =>{
    const produtos = data.produtos;
    const produtosEstoque = produtos.filter(x => x.estoque !== 0);
    const query = req.query;

    if(query.precoInicial && query.precoFinal && query.categoria){
       const filtroPrecosECategoria = produtosEstoque.filter(x => x.preco >= query.precoInicial && x.preco <= query.precoFinal && x.categoria.toLowerCase() === query.categoria.toLowerCase());
       res.json(filtroPrecosECategoria)
    } else if(query.precoInicial && query.precoFinal){
        const filtroPrecos = produtosEstoque.filter(x => x.preco >= query.precoInicial && x.preco <= query.precoFinal)
        res.json(filtroPrecos)
    } else if (query.categoria){
        const filtroCategoria = produtosEstoque.filter(x => x.categoria.toLowerCase() === query.categoria.toLowerCase());
        res.json(filtroCategoria)
    } else {
        res.json(produtosEstoque)
    }
})

app.listen(3000);