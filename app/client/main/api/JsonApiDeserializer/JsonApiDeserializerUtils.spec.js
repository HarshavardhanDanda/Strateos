import { expect } from 'chai';
import _ from 'lodash';

import JsonApiDeserializer from './JsonApiDeserializer';

describe('JSON API Deserializer', () => {
  describe('simple JSONAPI array document', () => {
    it('should returns attributes', () => {
      const dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { first_name: 'Sandro', last_name: 'Munda' }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: { first_name: 'Lawrence', last_name: 'Bennett' }
        }]
      };

      const json = new JsonApiDeserializer().deserialize(dataSet);

      expect(json).to.be.an('array').with.length(2);
      expect(json[0]).to.be.eql({
        id: '54735750e16638ba1eee59cb',
        first_name: 'Sandro',
        last_name: 'Munda'
      });
      expect(json[1]).to.be.eql({
        id: '5490143e69e49d0c8f9fc6bc',
        first_name: 'Lawrence',
        last_name: 'Bennett'
      });
    });
  });

  describe('simple JSONAPI single document', () => {
    it('should returns attributes', () => {
      const dataSet = {
        data: {
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { first_name: 'Sandro', last_name: 'Munda' }
        }
      };

      const json = new JsonApiDeserializer().deserialize(dataSet);

      expect(json).to.be.eql({
        id: '54735750e16638ba1eee59cb',
        first_name: 'Sandro',
        last_name: 'Munda'
      });
    });
  });

  describe('Nested documents', () => {
    it('should returns attributes', () => {
      const dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: {
            first_name: 'Sandro',
            last_name: 'Munda',
            books: [{
              book_title: 'Tesla, SpaceX.',
              isbn: '978-0062301239'
            }, {
              book_title: 'Steve Jobs',
              isbn: '978-1451648546'
            }]
          }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: {
            first_name: 'Lawrence',
            last_name: 'Bennett',
            books: [{
              book_title: 'Zero to One',
              isbn: '978-0804139298'
            }, {
              book_title: 'Einstein: His Life and Universe',
              isbn: '978-0743264747'
            }]
          }
        }]
      };

      const json = new JsonApiDeserializer().deserialize(dataSet);

      expect(json).to.be.an('array').with.length(2);

      expect(json[0]).to.have.key('id', 'first_name', 'last_name', 'books');
      expect(json[0].books).to.be.an('array');
      expect(json[0].books[0]).to.be.eql({
        book_title: 'Tesla, SpaceX.',
        isbn: '978-0062301239'
      });
      expect(json[0].books[1]).to.be.eql({
        book_title: 'Steve Jobs',
        isbn: '978-1451648546'
      });

      expect(json[1]).to.have.key('id', 'first_name', 'last_name', 'books');
    });
  });

  describe('Compound document', () => {
    it('should merge included relationships to attributes', () => {
      const dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: {
            first_name: 'Sandro',
            last_name: 'Munda'
          },
          relationships: {
            address: {
              data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
            }
          }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: {
            first_name: 'Lawrence',
            last_name: 'Bennett'
          },
          relationships: {
            address: {
              data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
            }
          }
        }],
        included: [{
          type: 'addresses',
          id: '54735722e16620ba1eee36af',
          attributes: {
            address_line1: '406 Madison Court',
            zip_code: '49426',
            country: 'USA'
          }
        }, {
          type: 'addresses',
          id: '54735697e16624ba1eee36bf',
          attributes: {
            address_line1: '361 Shady Lane',
            zip_code: '23185',
            country: 'USA'
          }
        }]
      };

      const json = new JsonApiDeserializer().deserialize(dataSet);

      expect(json).to.be.an('array').with.length(2);

      expect(json[0]).to.have.key('id', 'first_name', 'last_name', 'address');

      expect(json[0].address).to.be.eql({
        id: '54735722e16620ba1eee36af',
        address_line1: '406 Madison Court',
        zip_code: '49426',
        country: 'USA'
      });

      expect(json[1]).to.have.key('id', 'first_name', 'last_name', 'address');

      expect(json[1].address).to.be.eql({
        id: '54735697e16624ba1eee36bf',
        address_line1: '361 Shady Lane',
        zip_code: '23185',
        country: 'USA'
      });
    });

    describe('With multiple levels', () => {
      it('should merge all include relationships to attributes', () => {
        const dataSet = {
          data: [{
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              first_name: 'Sandro',
              last_name: 'Munda'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
              }
            }
          }, {
            type: 'users',
            id: '5490143e69e49d0c8f9fc6bc',
            attributes: {
              first_name: 'Lawrence',
              last_name: 'Bennett'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
              }
            }
          }],
          included: [{
            type: 'addresses',
            id: '54735722e16620ba1eee36af',
            attributes: {
              address_line1: '406 Madison Court',
              zip_code: '49426',
              country: 'USA'
            },
            relationships: {
              lock: { data: { type: 'lock', id: '1' } }
            }
          }, {
            type: 'addresses',
            id: '54735697e16624ba1eee36bf',
            attributes: {
              address_line1: '361 Shady Lane',
              zip_code: '23185',
              country: 'USA'
            },
            relationships: {
              lock: {
                data: { type: 'lock', id: '2' }
              }
            }
          }, {
            type: 'lock',
            id: '1',
            attributes: {
              secret_key: 'S*7v0oMf7YxCtFyA$ffy'
            },
            relationships: {
              key: {
                data: { type: 'key', id: '1' }
              }
            }
          }, {
            type: 'key',
            id: '1',
            attributes: {
              'public-key': '1*waZCXVE*XXpn*Izc%t'
            }
          }]
        };

        const json = new JsonApiDeserializer().deserialize(dataSet);

        expect(json).to.be.an('array').with.length(2);

        expect(json[0]).to.have.key('id', 'first_name', 'last_name', 'address');

        expect(json[0].address).to.be.eql({
          address_line1: '406 Madison Court',
          zip_code: '49426',
          country: 'USA',
          id: '54735722e16620ba1eee36af',
          lock: {
            id: '1',
            secret_key: 'S*7v0oMf7YxCtFyA$ffy',
            key: {
              id: '1',
              'public-key': '1*waZCXVE*XXpn*Izc%t'
            }
          }
        });

        expect(json[1]).to.have.key('id', 'first_name', 'last_name', 'address');

        expect(json[1].address).to.be.eql({
          id: '54735697e16624ba1eee36bf',
          address_line1: '361 Shady Lane',
          zip_code: '23185',
          country: 'USA'
        });
      });
    });

    describe('With polymorphic relationships to same records', () => {
      it('should return all data without circular error', () => {
        const imageOne = 'https://avatars2.githubusercontent.com/u/15112077?s=400&u=9860ca2648dd28ec2c726d287980b4f7d615f590&v=4';
        const imageTwo = 'https://www.placewise.com/images/employees/ashley-schauer.jpg';
        const dataSet = {
          data: {
            id: '1',
            type: 'users',
            attributes: {
              first_name: 'Ashley',
              last_name: 'Schauer',
              username: 'AELSchauer'
            },
            relationships: {
              images: {
                data: [
                  { type: 'images', id: '1' },
                  { type: 'images', id: '2' }
                ]
              }
            }
          },
          included: [
            {
              id: '1',
              type: 'tags',
              attributes: { name: 'jpeg' }
            }, {
              id: '2',
              type: 'tags',
              attributes: { name: 'color' }
            }, {
              id: '3',
              type: 'tags',
              attributes: { name: 'profile-pic' }
            }, {
              id: '4',
              type: 'tags',
              attributes: { name: 'black-and-white' }
            }, {
              id: '1',
              type: 'images',
              attributes: {
                url: imageOne
              },
              relationships: {
                tags: {
                  data: [
                    { type: 'tags', id: '1' },
                    { type: 'tags', id: '2' },
                    { type: 'tags', id: '3' }
                  ]
                }
              }
            },
            {
              id: '2',
              type: 'images',
              attributes: {
                url: imageTwo
              },
              relationships: {
                tags: {
                  data: [
                    { type: 'tags', id: '1' },
                    { type: 'tags', id: '3' },
                    { type: 'tags', id: '4' }
                  ]
                }
              }
            }
          ]
        };

        const json = new JsonApiDeserializer().deserialize(dataSet);

        expect(json).to.be.an('object');

        expect(json).to.have.key('id', 'first_name', 'last_name', 'username', 'images');

        expect(json.images).to.be.an('array').with.length(2);

        expect(json.images[0]).to.be.eql({
          url: imageOne,
          id: '1',
          tags: [
            { name: 'jpeg', id: '1' },
            { name: 'color', id: '2' },
            { name: 'profile-pic', id: '3' }
          ]
        });

        expect(json.images[1]).to.be.eql({
          url: imageTwo,
          id: '2',
          tags: [
            { name: 'jpeg', id: '1' },
            { name: 'profile-pic', id: '3' },
            { name: 'black-and-white', id: '4' }
          ]
        });
      });
    });

    describe('With self-referencing relationships', () => {
      it('should return all data without circular error', () => {
        const dataSet = {
          data: {
            id: '1',
            type: 'malls',
            attributes: {
              name: 'Twin Pines Mall'
            },
            relationships: {
              stores: {
                data: [
                  { type: 'stores', id: '1' },
                  { type: 'stores', id: '2' },
                  { type: 'stores', id: '3' }
                ]
              },
              deals: {
                data: [
                  { type: 'deals', id: '1' },
                  { type: 'deals', id: '2' },
                  { type: 'deals', id: '3' }
                ]
              }
            }
          },
          included: [
            {
              id: '1',
              type: 'stores',
              attributes: {
                name: 'Tasty Food'
              },
              relationships: {
                deals: {
                  data: [
                    { type: 'deals', id: '1' },
                    { type: 'deals', id: '2' }
                  ]
                }
              }
            }, {
              id: '2',
              type: 'stores',
              attributes: {
                name: 'Fashionable Clothes'
              },
              relationships: {
                deals: {
                  data: [
                    { type: 'deals', id: '3' }
                  ]
                }
              }
            }, {
              id: '3',
              type: 'stores',
              attributes: {
                name: 'Readable Books'
              }
            }, {
              id: '1',
              type: 'deals',
              attributes: {
                name: 'Free Drink with Snack Purchase'
              },
              relationships: {
                stores: {
                  data: [
                    { type: 'stores', id: '1' }
                  ]
                }
              }
            }, {
              id: '2',
              type: 'deals',
              attributes: {
                name: 'Free Samples of New Delicious Treat'
              },
              relationships: {
                stores: {
                  data: [
                    { type: 'stores', id: '1' }
                  ]
                }
              }
            }, {
              id: '3',
              type: 'deals',
              attributes: {
                name: 'Buy One Get One Off Shirts'
              },
              relationships: {
                stores: {
                  data: [
                    { type: 'stores', id: '2' }
                  ]
                }
              }
            }
          ]
        };

        const json = new JsonApiDeserializer().deserialize(dataSet);

        expect(json).to.be.an('object');

        expect(json).to.be.be.eql({
          name: 'Twin Pines Mall',
          id: '1',
          stores: [
            {
              name: 'Tasty Food',
              id: '1',
              deals: [
                {
                  name: 'Free Drink with Snack Purchase',
                  id: '1',
                  stores: [
                    { name: 'Tasty Food', id: '1' }
                  ]
                }, {
                  name: 'Free Samples of New Delicious Treat',
                  id: '2',
                  stores: [
                    { name: 'Tasty Food', id: '1' }
                  ]
                }
              ]
            }, {
              name: 'Fashionable Clothes',
              id: '2',
              deals: [
                {
                  name: 'Buy One Get One Off Shirts',
                  id: '3',
                  stores: [
                    { name: 'Fashionable Clothes', id: '2' }
                  ]
                }
              ]
            }, {
              name: 'Readable Books',
              id: '3'
            }
          ],
          deals: [
            {
              name: 'Free Drink with Snack Purchase',
              id: '1',
              stores: [
                {
                  name: 'Tasty Food',
                  id: '1',
                  deals: [
                    { name: 'Free Drink with Snack Purchase', id: '1' },
                    { name: 'Free Samples of New Delicious Treat', id: '2' }
                  ]
                }
              ]
            },
            {
              name: 'Free Samples of New Delicious Treat',
              id: '2',
              stores: [
                {
                  name: 'Tasty Food',
                  id: '1',
                  deals: [
                    { name: 'Free Drink with Snack Purchase', id: '1' },
                    { name: 'Free Samples of New Delicious Treat', id: '2' }
                  ]
                }
              ]
            },
            {
              name: 'Buy One Get One Off Shirts',
              id: '3',
              stores: [
                {
                  name: 'Fashionable Clothes',
                  id: '2',
                  deals: [
                    { name: 'Buy One Get One Off Shirts', id: '3' }
                  ]
                }
              ]
            }
          ]
        });
      });
    });

    describe('With relationships data array', () => {
      it('should merge included relationships to attributes', () => {
        const dataSet = {
          data: [{
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              first_name: 'Sandro',
              last_name: 'Munda'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
              }
            }
          }, {
            type: 'users',
            id: '5490143e69e49d0c8f9fc6bc',
            attributes: {
              first_name: 'Lawrence',
              last_name: 'Bennett'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
              }
            }
          }],
          included: [{
            type: 'addresses',
            id: '54735722e16620ba1eee36af',
            attributes: {
              address_line1: '406 Madison Court',
              zip_code: '49426',
              country: 'USA'
            },
            relationships: {
              locks: {
                data: [{ type: 'lock', id: '1' }, { type: 'lock', id: '2' }]
              }
            }
          }, {
            type: 'addresses',
            id: '54735697e16624ba1eee36bf',
            attributes: {
              address_line1: '361 Shady Lane',
              zip_code: '23185',
              country: 'USA'
            }
          }, {
            type: 'lock',
            id: '1',
            attributes: {
              secret_key: 'S*7v0oMf7YxCtFyA$ffy'
            }
          }, {
            type: 'lock',
            id: '2',
            attributes: {
              secret_key: 'En8zd6ZT6#q&Fz^EwGMy'
            }
          }]
        };

        const json = new JsonApiDeserializer().deserialize(dataSet);

        expect(json).to.be.an('array').with.length(2);

        expect(json[0]).to.have.key('id', 'first_name', 'last_name', 'address');

        expect(json[0].address).to.be.eql({
          address_line1: '406 Madison Court',
          zip_code: '49426',
          country: 'USA',
          id: '54735722e16620ba1eee36af',
          locks: [
            { secret_key: 'S*7v0oMf7YxCtFyA$ffy', id: '1' },
            { secret_key: 'En8zd6ZT6#q&Fz^EwGMy', id: '2' }
          ]
        });

        expect(json[1]).to.have.key('id', 'first_name', 'last_name', 'address');

        expect(json[1].address).to.be.eql({
          id: '54735697e16624ba1eee36bf',
          address_line1: '361 Shady Lane',
          zip_code: '23185',
          country: 'USA'
        });
      });

      it('should merge included and reused relationships to attributes of shallow resources', () => {
        const dataSet = {
          data: [{
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              first_name: 'Sandro',
              last_name: 'Munda'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
              }
            }
          }, {
            type: 'users',
            id: '5490143e69e49d0c8f9fc6bc',
            attributes: {
              first_name: 'Lawrence',
              last_name: 'Bennett'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
              }
            }
          }, {
            type: 'users',
            id: '5490143e69e49d0c8f99bd62',
            attributes: {
              first_name: 'Mary',
              last_name: 'Munda'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
              }
            }
          }],
          included: [{
            type: 'addresses',
            id: '54735722e16620ba1eee36af',
            attributes: {
              address_line1: '406 Madison Court',
              zip_code: '49426',
              country: 'USA'
            },
            relationships: {
              locks: {
                data: [{ type: 'lock', id: '1' }, { type: 'lock', id: '2' }]
              }
            }
          }, {
            type: 'addresses',
            id: '54735697e16624ba1eee36bf',
            attributes: {
              address_line1: '361 Shady Lane',
              zip_code: '23185',
              country: 'USA'
            }
          }, {
            type: 'lock',
            id: '1',
            attributes: {
              secret_key: 'S*7v0oMf7YxCtFyA$ffy'
            }
          }, {
            type: 'lock',
            id: '2',
            attributes: {
              secret_key: 'En8zd6ZT6#q&Fz^EwGMy'
            }
          }]
        };

        const json = new JsonApiDeserializer().deserialize(dataSet);

        expect(json).to.be.an('array').with.length(3);

        expect(json[0]).to.have.key('id', 'first_name', 'last_name', 'address');

        expect(json[0].address).to.be.eql({
          address_line1: '406 Madison Court',
          zip_code: '49426',
          country: 'USA',
          id: '54735722e16620ba1eee36af',
          locks: [
            { secret_key: 'S*7v0oMf7YxCtFyA$ffy', id: '1' },
            { secret_key: 'En8zd6ZT6#q&Fz^EwGMy', id: '2' }
          ]
        });

        expect(json[1]).to.have.key('id', 'first_name', 'last_name', 'address');

        expect(json[1].address).to.be.eql({
          id: '54735697e16624ba1eee36bf',
          address_line1: '361 Shady Lane',
          zip_code: '23185',
          country: 'USA'
        });

        expect(json[2]).to.have.key('id', 'first_name', 'last_name', 'address');

        expect(json[2].address).to.be.eql({
          address_line1: '406 Madison Court',
          zip_code: '49426',
          country: 'USA',
          id: '54735722e16620ba1eee36af',
          locks: [
            { secret_key: 'S*7v0oMf7YxCtFyA$ffy', id: '1' },
            { secret_key: 'En8zd6ZT6#q&Fz^EwGMy', id: '2' }
          ]
        });
      });

      it('should merge included and reused relationships to attributes of nested resources', () => {
        const dataSet = {
          data: [{
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              first_name: 'Sandro',
              last_name: 'Munda'
            },
            relationships: {
              addresses: {
                data: [
                  { type: 'addresses', id: '54735722e16620ba1eee36af' },
                  { type: 'addresses', id: '54735697e16624ba1eee36bf' },
                  { type: 'addresses', id: '54735697e16624ba1eee36cf' }
                ]
              }
            }
          }],
          included: [{
            type: 'addresses',
            id: '54735722e16620ba1eee36af',
            attributes: {
              address_line1: '406 Madison Court',
              zip_code: '49426',
              country: 'USA'
            },
            relationships: {
              lock: {
                data: { type: 'lock', id: '1' }
              }
            }
          }, {
            type: 'addresses',
            id: '54735697e16624ba1eee36bf',
            attributes: {
              address_line1: '361 Shady Lane',
              zip_code: '23185',
              country: 'USA'
            },
            relationships: {
              lock: {
                data: { type: 'lock', id: '2' }
              }
            }
          }, {
            type: 'addresses',
            id: '54735697e16624ba1eee36cf',
            attributes: {
              address_line1: '123 Sth Street',
              zip_code: '12332',
              country: 'USA'
            },
            relationships: {
              lock: {
                data: { type: 'lock', id: '1' }
              }
            }
          }, {
            type: 'lock',
            id: '1',
            attributes: {
              secret_key: 'S*7v0oMf7YxCtFyA$ffy'
            }
          }, {
            type: 'lock',
            id: '2',
            attributes: {
              secret_key: 'En8zd6ZT6#q&Fz^EwGMy'
            }
          }]
        };

        const json = new JsonApiDeserializer().deserialize(dataSet);

        expect(json).to.be.an('array').with.length(1);

        expect(json[0]).to.have.key('id', 'first_name', 'last_name', 'addresses');

        expect(json[0].addresses[0]).to.be.eql({
          address_line1: '406 Madison Court',
          zip_code: '49426',
          country: 'USA',
          id: '54735722e16620ba1eee36af',
          lock: { secret_key: 'S*7v0oMf7YxCtFyA$ffy', id: '1' }
        });

        expect(json[0].addresses[1]).to.be.eql({
          address_line1: '361 Shady Lane',
          zip_code: '23185',
          country: 'USA',
          id: '54735697e16624ba1eee36bf',
          lock: { secret_key: 'En8zd6ZT6#q&Fz^EwGMy', id: '2' }
        });

        expect(json[0].addresses[2].lock).to.be.eql({
          secret_key: 'S*7v0oMf7YxCtFyA$ffy', id: '1'
        });
      });
    });

    describe('Without included', () => {
      const baseDataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: {
            first_name: 'Sandro',
            last_name: 'Munda'
          },
          relationships: {
            address: {
              data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
            }
          }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: {
            first_name: 'Lawrence',
            last_name: 'Bennett'
          },
          relationships: {
            address: {
              data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
            }
          }
        }]
      };

      it('should use the value of valueForRelationship opt', () => {
        const dataSet = _.cloneDeep(baseDataSet);
        const json = new JsonApiDeserializer({
          addresses: {
            valueForRelationship: (relationship) => {
              return {
                id: relationship.id,
                address_line1: '406 Madison Court',
                zip_code: '49426',
                country: 'USA'
              };
            }
          }
        }).deserialize(dataSet);

        expect(json).to.be.an('array').with.length(2);

        expect(json[0]).to.have.key('id', 'first_name', 'last_name', 'address');

        expect(json[0].address).to.be.eql({
          id: '54735722e16620ba1eee36af',
          address_line1: '406 Madison Court',
          zip_code: '49426',
          country: 'USA'
        });

        expect(json[1]).to.have.key('id', 'first_name', 'last_name', 'address');

        expect(json[1].address).to.be.eql({
          id: '54735697e16624ba1eee36bf',
          address_line1: '406 Madison Court',
          zip_code: '49426',
          country: 'USA'
        });
      });
      it('should throw an error when passing a promise to valueForRelationship opt', () => {
        const dataSet = _.cloneDeep(baseDataSet);
        const deserializer = new JsonApiDeserializer({
          addresses: {
            valueForRelationship: (relationship) => {
              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    id: relationship.id,
                  });
                }, 10);
              });
            }
          }
        });

        expect(() => {
          deserializer.deserialize(dataSet);
        }).to.throw('Can not pass a promise in valueForRelationship when using deserialzeSync!');
      });
    });

    describe('With empty relationship', () => {
      it('should include the relationship as null (one-to)', () => {
        const dataSet = {
          data: {
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              first_name: 'Sandro',
              last_name: 'Munda'
            },
            relationships: {
              address: { data: null }
            }
          }
        };

        const json = new JsonApiDeserializer().deserialize(dataSet);

        expect(json).eql({
          id: '54735750e16638ba1eee59cb',
          first_name: 'Sandro',
          last_name: 'Munda',
          address: null
        });
      });

      it('should include the relationship as empty array (to-many)', () => {
        const dataSet = {
          data: {
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              first_name: 'Sandro',
              last_name: 'Munda'
            },
            relationships: {
              addresses: { data: [] }
            }
          }
        };

        const json = new JsonApiDeserializer().deserialize(dataSet);

        expect(json).eql({
          id: '54735750e16638ba1eee59cb',
          first_name: 'Sandro',
          last_name: 'Munda',
          addresses: []
        });
      });
    });

    describe('With null included nested relationship', () => {
      it('should ignore the nested relationship', () => {
        const dataSet = {
          data: {
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              first_name: 'Sandro',
              last_name: 'Munda'
            },
            relationships: {
              address: {
                data: {
                  id: '2e593a7f2c3f2e5fc0b6ea1d4f03a2a3',
                  type: 'address'
                }
              }
            }
          },
          included:
            [
              {
                id: '2e593a7f2c3f2e5fc0b6ea1d4f03a2a3',
                type: 'address',
                attributes: {
                  state: 'Alabama',
                  zip_code: '35801'
                },
                relationships: {
                  telephone: {
                    data: null
                  }
                }
              }
            ]
        };

        const json = new JsonApiDeserializer().deserialize(dataSet);

        expect(json).eql({
          id: '54735750e16638ba1eee59cb',
          first_name: 'Sandro',
          last_name: 'Munda',
          address: {
            id: '2e593a7f2c3f2e5fc0b6ea1d4f03a2a3',
            state: 'Alabama',
            zip_code: '35801',
            telephone: null
          }
        });
      });
    });

    describe('Without data.attributes, resource identifier', () => {
      it('should deserialize an object without data.attributes', () => {
        const dataSet = {
          data: {
            type: 'users',
            id: '54735750e16638ba1eee59cb'
          }
        };

        const json = new JsonApiDeserializer().deserialize(dataSet);

        expect(json).eql({
          id: '54735750e16638ba1eee59cb'
        });
      });
    });

    describe('without ID', () => {
      it('ID should not be returned', () => {
        const dataSet = {
          data: {
            type: 'users',
            attributes: { first_name: 'Sandro', last_name: 'Munda' }
          }
        };

        const json = new JsonApiDeserializer().deserialize(dataSet);

        expect(json).to.be.eql({
          first_name: 'Sandro',
          last_name: 'Munda'
        });
      });
    });

    describe('when mixed collection with option to include type as attributes', () => {
      it('should include type as key', () => {
        const dataSet = {
          data: [{
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              first_name: 'Sandro',
              last_name: 'Munda'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
              }
            }
          }, {
            type: 'locations',
            id: '5490143e69e49d0c8f9fc6bc',
            attributes: {
              name: 'Shady Location',
              address_line1: '361 Shady Lane',
              zip_code: '23185',
              country: 'USA'
            },
          }],
          included: [{
            type: 'addresses',
            id: '54735722e16620ba1eee36af',
            attributes: {
              address_line1: '406 Madison Court',
              zip_code: '49426',
              country: 'USA'
            }
          }]
        };

        const json = new JsonApiDeserializer({ typeAsAttribute: true }).deserialize(dataSet);

        expect(json).to.be.an('array').with.length(2);

        expect(json[0]).to.have.key('id', 'first_name', 'last_name', 'address', 'type');

        expect(json[0].address).to.be.eql({
          id: '54735722e16620ba1eee36af',
          address_line1: '406 Madison Court',
          zip_code: '49426',
          country: 'USA',
          type: 'addresses'
        });

        expect(json[1]).to.have.key('id', 'name', 'address_line1', 'zip_code', 'country', 'type');
        expect(json[1]).to.be.eql({
          name: 'Shady Location',
          address_line1: '361 Shady Lane',
          zip_code: '23185',
          country: 'USA',
          id: '5490143e69e49d0c8f9fc6bc',
          type: 'locations'
        });

      });
    });

    describe('With multiple relations', () => {
      it('should include both relations if they point to same include', () => {
        const dataSet = {
          data: {
            type: 'posts',
            id: 1,
            relationships: {
              owner: {
                data: {
                  type: 'users',
                  id: 1,
                },
              },
              publisher: {
                data: {
                  type: 'users',
                  id: 1,
                },
              },
            },
          },
          included: [
            {
              type: 'users',
              id: 1,
              attributes: {
                first_name: 'Sandro',
                last_name: 'Munda',
              },
            },
          ],
        };

        const json = new JsonApiDeserializer().deserialize(dataSet);

        expect(json).to.be.an('object').with.keys('id', 'owner', 'publisher');
        expect(json.owner).to.exist;
        expect(json.publisher).to.exist;
        expect(json.owner).to.be.eql(json.publisher);
      });
    });
  });

  describe('without callback', () => {
    it('should return promise', () => {
      const dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { first_name: 'Sandro', last_name: 'Munda' }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: { first_name: 'Lawrence', last_name: 'Bennett' }
        }]
      };

      const json = new JsonApiDeserializer().deserialize(dataSet);

      expect(json).to.be.an('array').with.length(2);
      expect(json[0]).to.be.eql({
        id: '54735750e16638ba1eee59cb',
        first_name: 'Sandro',
        last_name: 'Munda'
      });
      expect(json[1]).to.be.eql({
        id: '5490143e69e49d0c8f9fc6bc',
        first_name: 'Lawrence',
        last_name: 'Bennett'
      });
    });
  });

  describe('Circular references', () => {
    it('should not create an infinite loop', () => {
      const dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: {
            first_name: 'Sandro',
            last_name: 'Munda'
          },
          relationships: {
            address: {
              data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
            }
          }
        }],
        included: [{
          type: 'addresses',
          id: '54735722e16620ba1eee36af',
          attributes: {
            address_line1: '406 Madison Court',
            zip_code: '49426'
          },
          relationships: {
            country: {
              data: { type: 'countries', id: '54735722e16609ba1eee36af' }
            }
          }
        }, {
          type: 'countries',
          id: '54735722e16609ba1eee36af',
          attributes: {
            country: 'USA'
          },
          relationships: {
            address: {
              data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
            }
          }
        }]
      };

      const json = new JsonApiDeserializer().deserialize(dataSet);

      expect(json).to.be.an('array').with.length(1);
      expect(json[0]).to.have.key('id', 'first_name', 'last_name', 'address');
      expect(json[0].address).to.be.eql({
        address_line1: '406 Madison Court',
        zip_code: '49426',
        id: '54735722e16620ba1eee36af',
        country: {
          country: 'USA',
          id: '54735722e16609ba1eee36af',
          address: {
            address_line1: '406 Madison Court',
            zip_code: '49426',
            id: '54735722e16620ba1eee36af',
          }
        }
      });
    });
  });

  describe('transform', () => {
    it('should transform record before deserialization', () => {
      const dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { first_name: 'Sandro', last_name: 'Munda' }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: { first_name: 'Lawrence', last_name: 'Bennett' }
        }]
      };

      const json = new JsonApiDeserializer({
        transform: (record) => {
          record.full_name = record.first_name + ' ' + record.last_name;
          delete record.first_name;
          delete record.last_name;
          return record;
        }
      }).deserialize(dataSet);

      expect(json).to.be.an('array').with.length(2);
      expect(json[0]).to.be.eql({
        id: '54735750e16638ba1eee59cb',
        full_name: 'Sandro Munda'
      });
      expect(json[1]).to.be.eql({
        id: '5490143e69e49d0c8f9fc6bc',
        full_name: 'Lawrence Bennett'
      });
    });
  });

  describe('meta', () => {
    it('should be included', () => {
      const dataSet = {
        data: {
          type: 'users',
          attributes: { first_name: 'Sandro', last_name: 'Munda' },
          meta: {
            some: 'attribute'
          }
        }
      };

      const json = new JsonApiDeserializer().deserialize(dataSet);

      expect(json).to.be.eql({
        first_name: 'Sandro',
        last_name: 'Munda',
        meta: {
          some: 'attribute'
        }
      });
    });
  });

  describe('links', () => {
    it('should be included', () => {
      const dataSet = {
        data: {
          type: 'users',
          attributes: { first_name: 'Sandro', last_name: 'Munda' },
        },
        links: {
          self: '/articles/1/relationships/tags',
          related: '/articles/1/tags'
        }
      };

      const json = new JsonApiDeserializer().deserialize(dataSet);

      expect(json).to.have.key('first_name', 'last_name', 'links');
      expect(json.links).to.be.eql({
        self: '/articles/1/relationships/tags',
        related: '/articles/1/tags'
      });
    });
  });

  describe('id', () => {
    it('should override the id field', () => {
      const dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { first_name: 'Sandro', last_name: 'Munda' }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: { first_name: 'Lawrence', last_name: 'Bennett' }
        }]
      };

      const json = new JsonApiDeserializer({
        id: '_id'
      }).deserialize(dataSet);

      expect(json[0]).to.not.have.keys('id');
      expect(json[1]).to.not.have.keys('id');
      expect(json[0]._id).equal('54735750e16638ba1eee59cb');
      expect(json[1]._id).equal('5490143e69e49d0c8f9fc6bc');

    });
  });
});
