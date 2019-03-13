/*
*
*
*       Complete the API routing below
*
*
*/
'use strict';
const expect = require('chai').expect;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectIdSchema = mongoose.Schema.Types.ObjectId;
const ObjectId = mongoose.Types.ObjectId;
const bcrypt = require('bcrypt');
const boardSchema = new Schema({
  name: String,
  threads: [{type: ObjectIdSchema, ref: 'Thread'}]
});
const Board = mongoose.model('Board', boardSchema);
const threadSchema = new Schema({
  text: String,
  created_on: Date,
  bumped_on: Date,
  reported: Boolean,
  delete_password: String,
  replies: [{_id: {type: ObjectIdSchema, ref: 'Reply'}, text: String, created_on: Date, delete_password: String, reported: Boolean}],
  board: {type: ObjectIdSchema, ref: 'Board'},
  replycount: Number,
});
const Thread = mongoose.model('Thread', threadSchema);
const replySchema = new Schema({
  text: String,
  created_on: Date,
  delete_password: String,
  reported: Boolean,
  thread: {type: ObjectIdSchema, ref: 'Thread'}
})
const Reply = mongoose.model('Reply', replySchema);
const saltRounds = 10;
mongoose.connect(process.env.DB);
module.exports = function (app) {
  app.route('/api/threads/:board')
    .post((req, res)=>{
    if (req.body.text == '' || req.body.delete_password == ''){return res.json({error: "required field not provided"})}
    let boardName = req.params.board;
    let text = req.body.text;
    bcrypt.hash(req.body.delete_password, saltRounds, (err, delete_password)=>{
      if(err){return console.error(err)};
      Thread.create({
        text: text,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        delete_password: delete_password,
        replies: [],
        replycount: 0,
      },(err, thread)=>{
        if(err){return console.error(err)};
        Board.findOneAndUpdate({name: boardName},{$push: {threads: thread}}, {upsert: true, new: true}, (err, board)=>{
          if(err){return console.error(err)};
          thread.board = board._id;
          thread.save();
          if(process.env.NODE_ENV == 'test'){
            return res.json({_id: thread._id, text: thread.text, created_on: thread.created_on, bumped_on: thread.bumped_on, reported: thread.reported, replies: thread.replies, replycount: thread.replycount, board: thread.board});
          }else{return res.redirect(`/b/${boardName}`)}
        })
      })
    })
  })
    .get((req,res)=>{
    let boardName = req.params.board;
    Board.findOne({name: boardName}, (err, board)=>{
      if(err){return console.error(err)}
      Thread.find({board: board}, '-delete_password', {limit: 10, sort:{bumped_on: -1}},(err, threads)=>{
        if(err){return console.error(err)};
        for(let i = 0; i < threads.length; i++){
          threads[i].replies = threads[i].replies.sort((a, b)=>{
            if(a.created_on < b.created_on){return 1}
            return -1;
          })
          threads[i].replies = threads[i].replies.slice(0,3);
        }
        return res.json(threads);
      })
    })
  })
    .delete((req, res)=>{
    let boardName = req.params.board;
    let _id = req.body.thread_id;
    Thread.findById(_id, (err, thread)=>{
      if(err){return console.error(err)}; 
      bcrypt.compare(req.body.delete_password, thread.delete_password, (err, passwordCorrect)=>{
        if(err){return console.error(err)};
        if(!passwordCorrect){return res.send("incorrect password")};
        Thread.findByIdAndDelete(_id, (err, thread)=>{
          if(err){return console.error(err)};
          let board_id = thread.board;
          Reply.deleteMany({thread: _id}, (err, replies)=>{
            if(err){return console.error(err)};
            Board.findByIdAndUpdate(board_id, {$pull: {threads: ObjectId(_id)}}, {new: true}, (err, board)=>{
              if(err){return console.error(err)};
              if(process.env.NODE_ENV == 'test'){
              return res.json({_id: thread._id, board_threads: board.threads});
              } else {return res.send('success')}
            })
          })
        })
      })
    })
  })
    .put((req, res)=>{
    let boardName = req.params.board;
    let _id = req.body.thread_id;
    Thread.findByIdAndUpdate(_id, {reported: true}, {new: true},(err, thread)=>{
      if(err){return console.error(err)};
      if(process.env.NODE_ENV == 'test'){return res.json(thread);}
      else{return res.send('success')}
    })
  });
  app.route('/api/replies/:board')
    .post((req, res)=>{
    if(!req.params.board||!req.body.text||!req.body.thread_id||!req.body.delete_password){
      return res.send("Required info not provided!");
    }
    let boardName = req.params.board;
    let text = req.body.text;
    let thread_id = req.body.thread_id;
    bcrypt.hash(req.body.delete_password, saltRounds, (err, delete_password)=>{
      Reply.create({
        text: text,
        created_on: new Date(),
        delete_password: delete_password,
        reported: false,
        thread: thread_id,
      }, (err, reply)=>{
        if(err){return console.error(err)};
        reply.delete_password = undefined;
        Thread.findByIdAndUpdate(thread_id, {$push: {replies: reply}, $inc: {replycount: 1}, $set: {bumped_on: new Date()}}, (err, thread)=>{
          if(err){return console.error(err)};
          if(process.env.NODE_ENV == 'test'){
            return res.json({_id: reply._id, text: reply.text, created_on: reply.created_on, reported: reply.reported, thread: thread_id})
          } else {res.redirect(`/b/${boardName}/${thread_id}`)}
          })
      })
    })
  })
    .get((req, res)=>{
    let boardName = req.params.board;
    let thread_id = req.query.thread_id;
    Thread.findById(thread_id, '-delete_password', (err, thread)=>{
      if(err){console.error(err)};
      if(thread){return res.json(thread)}
      Reply.find({thread: thread_id},(err, replies)=>{
        if(err){return console.error(err)};
        return res.json(replies)
      })
    })
  })
    .delete((req, res)=>{
    let boardName = req.params.board;
    let thread_id = req.body.thread_id;
    let _id = req.body.reply_id;
    Reply.findById(_id, (err, reply)=>{
      if(err){return console.error(err)};
      bcrypt.compare(req.body.delete_password, reply.delete_password, (err, passwordCorrect)=>{
        if(err){return console.error(err)};
        if(!passwordCorrect){return res.send("incorrect password")};
        Reply.findByIdAndDelete(_id, (err)=>{
          if(err){return console.error(err)};
          Thread.findById(thread_id, '-delete_password',(err, thread)=>{
            if(err){return console.error(err)};
            let replyIndex = thread.replies.findIndex(e=>e._id == _id);
            thread.replies[replyIndex].text = '[deleted]'
            thread.save();
            if(process.env.NODE_ENV == 'test'){
              Reply.findById(_id, (err, reply)=>{
                if(err){return console.error(err)}
                return res.json({thread: thread, reply:reply})
              })
            } else{ return res.send('success')}
          })
        })
      })
    })
  })
    .put((req, res)=>{
    let boardName = req.params.board;
    let thread_id = req.body.thread_id;
    let _id = req.body.reply_id;
    Reply.findByIdAndUpdate(_id, {$set: {reported: true}}, {new: true, select: '-delete_password'}, (err, reply)=>{
      if(err){console.error(err)};
      if(process.env.NODE_ENV == 'test'){
        return res.json(reply);
      }
      return res.send("success");
    })
  });
};
