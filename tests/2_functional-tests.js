/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/
const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
chai.use(chaiHttp); 
//middleware
const cleanup = (_id, delete_password)=>{
  chai.request(server)
    .delete('/api/threads/test')
    .send({thread_id: _id, delete_password: delete_password})
    .end((err, res)=>{
    if(err){return console.error(err)}
    assert.equal(res.status, 200); 
    assert.isString(res.body._id);
  })
};
const post_test_reply = (thread_id, callback)=>{
  chai.request(server)
    .post('/api/replies/test')
    .send({thread_id: thread_id, text: 'test', delete_password: 'test'})
    .end((err, res)=>{
    if(err)console.error(err);
    callback();
  })
}
const post_test_thread = (callback)=>{
  chai.request(server)
    .post('/api/threads/test')
    .send({text: 'test', delete_password: 'test'})
    .end((err, res)=>{
    if(err){return console.error(err)};
    assert.equal(res.status, 200);
    assert.equal(res.body.text, 'test');
    let _id = res.body._id;
    callback(_id);
  })
}
//testing suite
suite('Functional Tests', ()=>{
  suite('API ROUTING FOR /api/threads/:board', ()=>{
    suite('POST', ()=>{
      test('All required fields provided.',(done)=>{
        chai.request(server)
          .post('/api/threads/test')
          .send({text:'test', delete_password:'test'})
          .end((err, res)=>{
          if(err){return console.error(err)};
          assert.equal(res.status, 200);
          assert.isString(res.body._id); 
          assert.equal(res.body.text, 'test');
          assert.isString(res.body.created_on);
          assert.isString(res.body.bumped_on);
          assert.isArray(res.body.replies);
          assert.isEmpty(res.body.replies);
          assert.equal(res.body.replycount, 0);
          assert.isString(res.body.board); 
          cleanup(res.body._id, 'test');
          done();
        })}
          )
      test('Text missing.', (done)=>{
        chai.request(server)
          .post('/api/threads/test')
          .send({text: '', delete_password: 'test'})
          .end((err, res)=>{
          if(err){return console.error(err)}
          assert.equal(res.status, 200)
          assert.equal(res.body.error, "required field not provided");
          done()
        })
      })
      test('Delete_password missing.', (done)=>{
        chai.request(server)
          .post('/api/threads/test')
          .send({text: 'test', delete_password: ''})
          .end((err, res)=>{
          if(err){return console.error(err)}
          assert.equal(res.status, 200)
          assert.equal(res.body.error, "required field not provided");
          done()
        })
      })
    });
    suite('GET', ()=>{
      test('Checking a single item on the board', (done)=>{
        post_test_thread((_id)=>{
          chai.request(server)
            .get('/api/threads/test')
            .send({})
            .end((err, res)=>{
            if(err){return console.error(err)};
            assert.equal(res.status, 200);
            assert.notProperty(res.body[0], 'delete_password');
            // assert.equal(res.body.length, 1); 
            cleanup(_id, 'test');
            done();
          })
        })
      });
      test('Checking a single item on the board with 4 replies, make sure only 3 returned', (done)=>{
        post_test_thread((_id)=>{
          post_test_reply(_id,()=>{
            post_test_reply(_id,()=>{
              post_test_reply(_id,()=>{
                post_test_reply(_id,()=>{
                  chai.request(server)
                    .get('/api/threads/test')
                    .send({})
                    .end((err, res)=>{
                    if(err){return console.error(err)};
                    assert.equal(res.status, 200);
                    // assert.equal(res.body.length, 1);
                    assert.equal(res.body[0].replies.length, 3);
                    cleanup(_id, 'test');
                    done();
                  })
                });
              });
            })
          }) 
        }) 
      })
      test('Posting 11 threads to the board and making sure only 10 show up', (done)=>{
        let list_of_ids = [];
        post_test_thread((_id)=>{
          list_of_ids.push(_id);
          post_test_thread((_id)=>{
            list_of_ids.push(_id);
            post_test_thread((_id)=>{
              list_of_ids.push(_id);
              post_test_thread((_id)=>{
                list_of_ids.push(_id);
                post_test_thread((_id)=>{
                  list_of_ids.push(_id);
                  post_test_thread((_id)=>{
                    list_of_ids.push(_id);
                    post_test_thread((_id)=>{
                      list_of_ids.push(_id);
                      post_test_thread((_id)=>{
                        list_of_ids.push(_id);
                        post_test_thread((_id)=>{
                          list_of_ids.push(_id);
                          post_test_thread((_id)=>{
                            list_of_ids.push(_id);
                            post_test_thread((_id)=>{
                              list_of_ids.push(_id);
                              chai.request(server)
                                .get('/api/threads/test')
                                .send({})
                                .end((err, res)=>{
                                if(err){return console.error(err)};
                                assert.equal(res.status, 200);
                                assert.equal(res.body.length, 10);
                                while(list_of_ids.length > 0){
                                  cleanup(list_of_ids.pop(), 'test');
                                } 
                                done(); 
                              })
                            })
                          })
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })  
      });  
    }); 
    suite('DELETE', ()=>{
      test("Delete entry using correct delete_password",(done)=>{
        post_test_thread((_id)=>{
          chai.request(server)
            .delete('/api/threads/test')
            .send({thread_id: _id, delete_password: 'test'})
            .end((err, res)=>{
            if(err){return console.error(err)}
            assert.equal(res.status, 200);
            assert.equal(res.body._id, _id);
            done();
          })
        })
      });
      test("Delete entry using incorrect delete_password",(done)=>{
        post_test_thread((_id)=>{
          chai.request(server)
            .delete('/api/threads/test')
            .send({thread_id: _id, delete_password: 'terst'})
            .end((err, res)=>{
            if(err){return console.error(err)}
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password")
            cleanup(_id, 'test');
            done();
          })
        })
      });
      test("Delete entry using correct delete_password, find out if deleted from board",(done)=>{
        post_test_thread((_id)=>{
          chai.request(server)
            .delete('/api/threads/test')
            .send({thread_id: _id, delete_password: 'test'})
            .end((err, res)=>{
            if(err){return console.error(err)}
            assert.equal(res.status, 200);
            assert.equal(res.body._id, _id);
            assert.notInclude(res.body.board_threads, res.body._id);
            done();
          })
        })
      });
      test("Delete entry using correct delete_password, make sure thread and replies are deleted",(done)=>{
        post_test_thread((_id)=>{
          chai.request(server)
            .delete('/api/threads/test')
            .send({thread_id: _id, delete_password: 'test'})
            .end((err, res)=>{
            if(err){return console.error(err)}
            assert.equal(res.status, 200);
            assert.equal(res.body._id, _id);
            chai.request(server)
              .get('/api/replies/test')
              .send({thread_id: _id})
              .end((err, res)=>{
              assert.isEmpty(res.body);
              done();
            })
          })
        })
      });
    });
    suite('PUT', ()=>{
      test("Check that entry is reported when put in a put request",(done)=>{
        post_test_thread((_id)=>{
          chai.request(server)
            .put('/api/threads/test')
            .send({thread_id: _id})
            .end((err, res)=>{
            if(err){return console.error(err)};
            assert.equal(res.status, 200);
            assert.equal(res.body.reported, true);
            cleanup(_id, 'test'); 
            done();
          })
        })
      })
      test("Submit two put requests and make sure that entry is still 'reported'",(done)=>{
        post_test_thread((_id)=>{
          chai.request(server)
            .put('/api/threads/test')
            .send({thread_id: _id})
            .end((err, res)=>{
            if(err){return console.error(err)};
            assert.equal(res.status, 200);
            assert.equal(res.body.reported, true);
            chai.request(server)
              .put('/api/threads/test')
              .send({thread_id: _id})
              .end((err, res)=>{
              if(err){return console.error(err)};
              assert.equal(res.status, 200);
              assert.equal(res.body.reported, true);
              cleanup(_id, 'test'); 
              done();})
          })
        })
      })
    });
  });
  suite('API ROUTING FOR /api/replies/:board', ()=>{
    suite('POST', ()=>{
      test("Post a reply with all required info",(done)=>{
        post_test_thread((thread_id)=>{
          chai.request(server)
            .post('/api/replies/test')
            .send({thread_id: thread_id, text:'test', delete_password:'test'})
            .end((err, res)=>{
            if(err){return console.error(err)};
            assert.equal(res.status, 200);
            cleanup(thread_id, 'test')
            done();
          })
        })
      })
      test("Post a reply with no text",(done)=>{
        post_test_thread((thread_id)=>{
          chai.request(server)
            .post('/api/replies/test')
            .send({thread_id: thread_id, delete_password:'test'})
            .end((err, res)=>{
            if(err){return console.error(err)}
            assert.equal(res.status, 200);
            assert.equal(res.text, "Required info not provided!");
            cleanup(thread_id, 'test')
            done();
          }) 
        })
      })
      test("Post a reply with no thread_id",(done)=>{
        post_test_thread((thread_id)=>{
          chai.request(server)
            .post('/api/replies/test')
            .send({text: 'test', delete_password:'test'})
            .end((err, res)=>{
            if(err){return console.error(err)}
            assert.equal(res.status, 200);
            assert.equal(res.text, "Required info not provided!");
            cleanup(thread_id, 'test')
            done();
          })
        })
      })
      test("Post a reply with no delete_password",(done)=>{
        post_test_thread((thread_id)=>{
          chai.request(server)
            .post('/api/replies/test')
            .send({thread_id: thread_id, text:'test'})
            .end((err, res)=>{
            if(err){return console.error(err)}
            assert.equal(res.status, 200);
            assert.equal(res.text, "Required info not provided!");
            cleanup(thread_id, 'test')
            done();
          })
        })
      })
    });
    suite('GET', ()=>{
      test("Post a thread and then a reply and make sure both show up",(done)=>{
        post_test_thread((_id)=>{
          post_test_reply(_id, ()=>{
            chai.request(server)
              .get('/api/replies/test')
              .query({thread_id: _id})
              .end((err, res)=>{
              assert.equal(res.status, 200);
              assert.equal(res.body.replies.length, 1);
              assert.notProperty(res.body, 'delete_password');
              assert.notProperty(res.body.replies[0], 'delete_password')
              cleanup(_id, 'test');
              done();
            })
          })
        })
      })
      test("Post a thread and then more than 3 replies and make sure all show up",(done)=>{
        post_test_thread((_id)=>{
          post_test_reply(_id, ()=>{
            post_test_reply(_id, ()=>{
              post_test_reply(_id, ()=>{
                post_test_reply(_id, ()=>{
                  post_test_reply(_id, ()=>{
                    chai.request(server)
                      .get('/api/replies/test')
                      .query({thread_id: _id})
                      .end((err, res)=>{
                      assert.equal(res.status, 200);
                      assert.equal(res.body.replies.length, 5);
                      assert.notProperty(res.body, 'delete_password');
                      assert.notProperty(res.body.replies[0], 'delete_password')
                      cleanup(_id, 'test');
                      done();
                    })
                  })
                })
              })
            })
          })
        })
      })
    });
    suite('PUT', ()=>{
      test("Post a thread and reply, PUT the reply and make sure it is reported", (done)=>{
        post_test_thread((thread_id)=>{
          chai.request(server)
            .post('/api/replies/test')
            .send({thread_id: thread_id, text: 'test', delete_password: 'test'})
            .end((err, res)=>{
            if(err){return console.error(err)}
            let _id = res.body._id;
            chai.request(server)
              .put('/api/replies/test')
              .send({thread_id: thread_id, reply_id: _id})
              .end((err, res)=>{
              assert.equal(res.status, 200);
              assert.equal(res.body.reported, true);
              cleanup(thread_id, 'test');
              done();
            })
          })
        })
      });
      test("Post a thread and reply, PUT the reply, PUT it a second time and make sure it stays reported", (done)=>{
        post_test_thread((thread_id)=>{
          chai.request(server)
            .post('/api/replies/test')
            .send({thread_id: thread_id, text: 'test', delete_password: 'test'})
            .end((err, res)=>{
            if(err){return console.error(err)}
            let _id = res.body._id;
            chai.request(server)
              .put('/api/replies/test')
              .send({thread_id: thread_id, reply_id: _id})
              .end((err, res)=>{
              assert.equal(res.status, 200);
              assert.equal(res.body.reported, true);
              chai.request(server)
                .put('/api/replies/test')
                .send({thread_id: thread_id, reply_id: _id})
                .end((err, res)=>{
                assert.equal(res.status, 200);
                assert.equal(res.body.reported, true);
                cleanup(thread_id, 'test');
                done();
              })
            })
          })
        })
      });
    });
    suite('DELETE', ()=>{ 
      test("Post a thread and reply, DELETE the reply, make sure it's deleted from replies and shows as [deleted] on the thread", (done)=>{
        post_test_thread((thread_id)=>{
          chai.request(server)
            .post('/api/replies/test')
            .send({thread_id: thread_id, text: 'test', delete_password: 'test'})
            .end((err, res)=>{
            if(err){return console.error(err)}
            let _id = res.body._id;
            chai.request(server)
              .delete('/api/replies/test')
              .send({thread_id: thread_id, reply_id: _id, delete_password: 'test'})
              .end((err, res)=>{
              assert.equal(res.status, 200);
              assert.equal(res.body.thread.replies[0].text, '[deleted]');
              assert.isNull(res.body.reply)
              cleanup(thread_id, 'test');
              done();
            })
          })
        })
      });
    });
  });
});
