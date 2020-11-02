//load libs
const express = require('express')
const hbs = require('express-handlebars')
// get the driver white promise support
const mysql2 = require('mysql2/promise')

//SQL
const SQL_FIND_BY_NAME = 'select * from apps where name like ? limit ?'
//!cannot use string concatination for SQL! the '?' is like the concat for SQL, it tells where the values are

// const SQL_FIND_BY_APP_ID = 'select * from'

let PORT = parseInt(process.argv[2]||parseInt(process.env.PORT)||3000)

//express instance and handlebars
const app = express(); 
app.engine('hbs',hbs({defaultLayout: 'default.hbs'}))
app.set('view engine', 'hbs')

//create the database connection pool
const pool = mysql2.createPool({
    host: process.env.DB_HOST || 'localhost', 
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "playstore",
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 4,
    timezone: '+08:00'
})

const startApp = async(app,pool) => {
    try{
        // acquire a connection from the connection pool
        const conn = await pool.getConnection();

        console.log('Pinging database....');
        await conn.ping();
        //release the connection
        conn.release();

        app.listen(PORT,()=>{
            console.log(`app is running on`,PORT);
        })

    }catch(e){
        console.log(`Cannot ping database: `,e);
    }
}

app.get('/', (req,res)=>{
    res.status(200)
    res.type('text/html')
    res.render('index')
})

app.get('/search',async(req,res)=>{
    const q = req.query['q']
    console.log(q)

    //acquire a connection from the pool
    const conn = await pool.getConnection();

    try{
        // perform the query
        // 'select * from apps where name like ? limit ?'
        const result = await conn.query(SQL_FIND_BY_NAME, [ `%${q}%`, 10 ])
        const recs = result[0]

        // console.log('recs = ', recs);
        
        res.status(200)
        res.type('text/html')
        res.render('searchResult', {
            recs,q,
            empty: recs.length<=0
        })
    }catch(e){
        console.log(e);
    } finally {
        //release connection
        conn.release();
    }


})

startApp(app, pool);

// app.listen((PORT),()=>{
//     console.log(`app is running on`,PORT);
// })