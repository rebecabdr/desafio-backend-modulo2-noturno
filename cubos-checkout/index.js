const express = require('express');
const data = require('./banco/data.json');
const bodyParser = require('body-parser');
const {lerArquivo, escreverNoArquivo} = require('./bibliotecaFS');
const { addBusinessDays } = require('date-fns');

const app = express();

app.use(express.json());


function adicionarProdutos(produto, carrinho, quantidade) {
   
    const indice = carrinho.findIndex(x => x.id === produto.id);
   
    if (indice >= 0) {
        carrinho[indice].quantidade += quantidade;
    } else {
        produto.quantidade = quantidade;
        carrinho.push(produto);
    }

    return carrinho;
}

function calculoSubTotal(produtosCarrinho){
    const total = produtosCarrinho.map(x => x.preco * x.quantidade).reduce((x,y) => x +y)

    return total
}

// GET listar produtos, com filtros ou sem.

app.get('/produtos', async (req, res) =>{
    const {produtos} = await lerArquivo();
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

app.get('/carrinho', async (req, res) =>{
    const {carrinho} = await lerArquivo();
    return res.json(carrinho)
});

app.post('/carrinho/produtos', async (req, res) =>{
    const {produtos, carrinho} =  await lerArquivo();
    const {id, quantidade} = req.body;

    const produtoAAdicionar = produtos.find(x => x.id === id);
    const produtoNoCarrinho = carrinho.produtos.find(x => x.id === id);

    // resolver questão de qntd solicitada maior que o disponível no estoque.

    if(produtoAAdicionar.estoque >= quantidade){
        
        if (produtoNoCarrinho){
            produtoNoCarrinho.quantidade += quantidade;
            produtoAAdicionar.estoque -= quantidade;
    
            await escreverNoArquivo({produtos, carrinho})
            res.json(carrinho)
    
        } else {
            const addProduct = {
                id: id,
                quantidade: quantidade,
                nome: produtoAAdicionar.nome,
                preco: produtoAAdicionar.preco,
                categoria: produtoAAdicionar.categoria
            }
    
            carrinho.produtos.push(addProduct);
    
            await escreverNoArquivo( { produtos, carrinho })
            res.json(carrinho)
        }
    
    } else {
        res.status(404)
        res.json({"mensagem":"A quantidade em estoque é insuficiente para essa compra!"});
        return
    }

    


    // if(quantidade <= localizarProduto.estoque){
    //     let data = await lerArquivo()
    //     const { carrinho} = data;

    //     const produtoAdd = adicionarProdutos(localizarProduto, carrinho, quantidade)

    //     const subTotal = calculoSubTotal(carrinho);
    //     const dataDeEntrega = addBusinessDays(new Date(), 15);
    //     const valorDoFrete = (subTotal <= 20000 ? 5000 : 0);
    //     const totalAPagar = subTotal + valorDoFrete;

    //     data ={
    //         "produtos": produtoAdd,
    //         "subtotal": subTotal,
    //         "dateDeEntrega": dataDeEntrega,
    //         "valorDoFrete": valorDoFrete,
    //         "totalAPagar": totalAPagar,
    //     }

    //     await escreverNoArquivo(data);

    //     res.json(carrinho)

    // } else {
    // return res.json("Quantidade insuficiente no estoque!")
// }
    

});

app.listen(3000);