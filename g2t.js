const goodreads = require("goodreads-api-node");
const Trello = require("trello");
require("dotenv").load();



var trello = new Trello(process.env.TRELLO_API_KEY, process.env.TRELLO_API_TOKEN);

const goodreadsCredentials = {
    key: process.env.GOODREADS_API_KEY,
    secret: process.env.GOODREADS_API_SECRET,
};


const boardName = process.env.TRELLO_BOARD_NAME;
const listName = process.env.TRELLO_LIST_NAME;

const gr = goodreads(goodreadsCredentials);


function getTrelloBoardListId() {
    var getBoards = function() {
        return trello.getBoards("me", null);
    }

    var getLists = function(boardId) {
        return trello.getListsOnBoard(boardId, null);
    }

    var getListId = function(lists) {
        return lists.filter(x => x.name === listName)[0].id;
    }

    var getBoardId = function(boards) {
        return boards.filter(x => x.name === boardName)[0].id;
    }


    return getBoards()
        .then(getBoardId)
        .then(getLists)
        .then(getListId);
}


function createTrelloCard(listId, book) {
    var cardTitle = `${book.title} - ${book.author}`
    trello.addCard(cardTitle, book.description, listId).then(function(trelloCard) {
        var cardId = trelloCard.id;
        console.log('Added card:', trelloCard);
        trello.addAttachmentToCard(cardId, book.image_url, function(err, card) {
            if (err) {
                console.log('Could not add link:', err);
            } else {
                console.log("Done");
            }
        });
    });
}

function getBook(bookId) {
    var getAuthor = function(authors) {
        if (!authors) return "";
        if (!authors.author) return "";
        return authors.author.name;
    }

    return gr.showBook(bookId).then(function(response) {
        var bookProxy = response.book;
        return {
            title: bookProxy.title,
            description: "", //bookProxy.description,
            author: getAuthor(bookProxy.authors),
            image_url: bookProxy.image_url,
            num_pages: bookProxy.num_pages
        };
    })
}

var args = process.argv;
if(args.length != 3) {
    console.err("Missing book key");
    return;
}

const bookId = args[2];

function createCardForBook(bookId){
    getTrelloBoardListId().then(function(listId) {
        getBook(bookId).then(function(book) {
            createTrelloCard(listId, book)
        });
    });
}

createCardForBook(bookId);