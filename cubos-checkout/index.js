const express = require('express');
const data = require('./banco/data.json');
const bodyParser = require('body-parser');
const {lerArquivo, escreverNoArquivo} = require('./bibliotecaFS');
const { addBusinessDays } = require('date-fns');

const app = express();

app.use(express.json());



function atualizarCarrinho (carrinho){
    const subTotal = carrinho.produtos.map(x => x.preco * x.quantidade).reduce((x,y) => x +y)
    const dataDeEntrega = addBusinessDays(new Date(), 15);
    const valorDoFrete = (subTotal <= 20000 ? 5000 : 0);
    const totalAPagar = subTotal + valorDoFrete;

    carrinho.subtotal = subTotal;
    carrinho.dataDeEntrega = dataDeEntrega;
    carrinho.valorDoFrete = valorDoFrete;
    carrinho.totalAPagar = totalAPagar;
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

    if(produtoAAdicionar.estoque >= quantidade){
        
        if (produtoNoCarrinho){
            produtoNoCarrinho.quantidade += quantidade;
            produtoAAdicionar.estoque -= quantidade;

            atualizarCarrinho(carrinho)
    
            await escreverNoArquivo({ produtos, carrinho })
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
            produtoAAdicionar.estoque -= quantidade;

            atualizarCarrinho(carrinho)

            await escreverNoArquivo( { produtos, carrinho })
            res.json(carrinho)
        }
    
    } else {
        res.status(404)
        res.json({"mensagem":"A quantidade em estoque é insuficiente para essa compra!"});
        return
    }
});

app.patch('/carrinho/produtos/:idProduto', async (req, res) => {
    const {produtos, carrinho} = await lerArquivo();
    const quantidade = req.body.quantidade;
    const idSolicitado = Number(req.params.idProduto);

    const idSolicitadoCarrinho = carrinho.produtos.find(x => x.id === idSolicitado);
    const idSolicitadoProdutos = produtos.find(x => x.id === idSolicitado);
    
    if(idSolicitadoCarrinho){
       
        if(quantidade > 0){         // se quantidade solicitada for positiva (adicionar), tenho que consultar o estoque

            if(idSolicitadoProdutos.estoque >= idSolicitadoCarrinho.quantidade){     // se o produto para alterar tem estoque suficiente
               
                idSolicitadoCarrinho.quantidade += quantidade;
                idSolicitadoProdutos.estoque -= quantidade;

                atualizarCarrinho(carrinho)
                
                await escreverNoArquivo( { produtos, carrinho })
                res.json(carrinho)

            } else {                // se o produto para alterar NÃO tem estoque suficiente
                res.status(404)
                res.json({"mensagem":"Estoque insuficiente para fazer essa alteração!"});
                return
            }

        } else {            // se quantidade solicitada for negativa (remover), tenho que consultar a quantidade no carrinho
            if(idSolicitadoCarrinho.quantidade >= (-quantidade)){     // se o produto para alterar NO CARRINHO tem quantidade suficiente
               
                idSolicitadoCarrinho.quantidade += quantidade;
                idSolicitadoProdutos.estoque -= quantidade;

                atualizarCarrinho(carrinho)
                
                await escreverNoArquivo( { produtos, carrinho })
                res.json(carrinho)

            } else {                // se o produto para alterar NO CARRINHO NÃO tem quantidade suficiente
                res.status(404)
                res.json({"mensagem":"Estoque insuficiente para fazer essa alteração!"});
                return
            }
        }

    } else {
        res.status(404)
        res.json({"mensagem":"Este item não se encontra no carrinho!"});
        return
    }
});

app.delete('/carrinho/produtos/:idProduto', async (req, res) => {
    const {produtos, carrinho} = await lerArquivo();
    const idSolicitado = Number(req.params.idProduto);

    const idSolicitadoCarrinho = carrinho.produtos.find(x => x.id === idSolicitado);
    const idSolicitadoProdutos = produtos.find(x => x.id === idSolicitado);

    if(idSolicitadoCarrinho){       // se o item a ser deletado consta no carrinho, deletamos e retornamos a quantidade para o estoque
        
        const indiceProdutoCarrinho = carrinho.produtos.indexOf(idSolicitadoCarrinho);
        
        carrinho.produtos.splice(indiceProdutoCarrinho, 1);
        idSolicitadoProdutos.estoque += idSolicitadoCarrinho.quantidade;
        
        atualizarCarrinho(carrinho)
                
        await escreverNoArquivo( { produtos, carrinho })
        res.json(carrinho)

    } else {                        // se o item a ser deletado NÃO consta no carrinho
        res.status(404)
        res.json({"mensagem":"Este item não se encontra no carrinho!"});
        return
    }
});




app.listen(3000);