(function () {
    const bookSections = [
        {
            year: 2026,
            count: 17,
            previewLabel: '> 17 books read in 2026.',
            books: [
                {
                    title: 'Intuition: Knowing Beyond Logic',
                    author: 'Osho',
                    cover: 'https://covers.openlibrary.org/b/id/177936-L.jpg'
                },
                {
                    title: 'Americana: A 400-Year History of American Capitalism',
                    author: 'Bhu Srinivasan',
                    cover: 'https://books.google.com/books/content?vid=ISBN9780399563799&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
                },
                {
                    title: 'Drive My Car',
                    author: 'Haruki Murakami',
                    cover: 'https://books.google.com/books/content?id=xStfEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
                },
                {
                    title: 'Synchronicity: An Acausal Connecting Principle',
                    author: 'C.G. Jung',
                    cover: 'https://books.google.com/books/content?id=ZBD3TwL7sAUC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
                },
                {
                    title: 'Gödel, Escher, Bach: an Eternal Golden Braid',
                    author: 'Douglas R. Hofstadter',
                    cover: 'https://books.google.com/books/content?vid=ISBN9780465026562&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
                },
                {
                    title: 'Gurēpufurūtsu Jūsu',
                    author: 'Yoko Ono',
                    cover: 'https://covers.openlibrary.org/b/id/471152-L.jpg'
                },
                {
                    title: 'The Metamorphosis of Prime Intellect',
                    author: 'Roger Williams',
                    cover: 'https://covers.openlibrary.org/b/id/10201476-L.jpg'
                },
                {
                    title: 'The Pleasure of Finding Things Out: The Best Short Works of Richard P. Feynman',
                    author: 'Richard P. Feynman',
                    cover: 'https://covers.openlibrary.org/b/id/463308-L.jpg'
                },
                {
                    title: 'Tao Te Ching: The Essential Translation of the Ancient Chinese Book of the Tao',
                    author: 'Lao Tzu',
                    cover: 'https://covers.openlibrary.org/b/id/662232-L.jpg'
                },
                {
                    title: 'Influence: The Psychology of Persuasion',
                    author: 'Robert B. Cialdini',
                    cover: 'https://covers.openlibrary.org/b/id/431011-L.jpg'
                },
                {
                    title: 'The Idea Factory: Bell Labs and the Great Age of American Innovation',
                    author: 'Jon Gertner',
                    cover: 'https://covers.openlibrary.org/b/id/7272459-L.jpg'
                },
                {
                    title: 'Simulacra and Simulation',
                    author: 'Jean Baudrillard',
                    cover: 'https://covers.openlibrary.org/b/id/307858-L.jpg'
                },
                {
                    title: 'The Art of Spending Money: Simple Choices for a Richer Life',
                    author: 'Morgan Housel',
                    cover: 'https://covers.openlibrary.org/b/id/15142229-L.jpg'
                },
                {
                    title: 'Permutation City',
                    author: 'Greg Egan',
                    cover: 'https://covers.openlibrary.org/b/id/1000639-L.jpg'
                },
                {
                    title: 'Orality and Literacy: 30th Anniversary Edition',
                    author: 'Walter J. Ong',
                    cover: 'https://covers.openlibrary.org/b/id/262067-L.jpg'
                },
                {
                    title: 'My Inventions and Other Writings',
                    author: 'Nikola Tesla',
                    cover: 'https://covers.openlibrary.org/b/id/8930015-L.jpg'
                },
                {
                    title: 'The Technology Trap: Capital, Labor, and Power in the Age of Automation',
                    author: 'Carl Benedikt Frey',
                    cover: 'https://covers.openlibrary.org/b/id/10097366-L.jpg'
                }
            ]
        },
        {
            year: 2025,
            count: 32,
            books: [
                {
                    title: 'Reality Transurfing Steps I-V',
                    author: 'Vadim Zeland',
                    cover: 'https://covers.openlibrary.org/b/id/10327355-L.jpg'
                },
                {
                    title: '海辺のカフカ〈下〉',
                    author: 'Haruki Murakami',
                    cover: 'https://covers.openlibrary.org/b/id/4982600-L.jpg'
                },
                {
                    title: 'Liftoff: Elon Musk and the Desperate Early Days That Launched SpaceX',
                    author: 'Eric Berger',
                    cover: 'https://books.google.com/books/content?id=vv2_zQEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'
                },
                {
                    title: 'The Last Economy: A Guide to the Age of Intelligent Economics',
                    author: 'Emad Mostaque',
                    cover: 'https://books.google.com/books/content?id=ZXx_EQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
                },
                {
                    title: 'The Art of Doing Science and Engineering: Learning to Learn',
                    author: 'Richard Hamming',
                    cover: 'https://covers.openlibrary.org/b/id/14153910-L.jpg'
                },
                {
                    title: 'The Brothers Karamazov',
                    author: 'Fyodor Dostoevsky',
                    cover: 'https://covers.openlibrary.org/b/id/15171299-L.jpg'
                },
                {
                    title: 'Clear Thinking: Turning Ordinary Moments into Extraordinary Results',
                    author: 'Shane Parrish',
                    cover: 'https://covers.openlibrary.org/b/id/14555583-L.jpg'
                },
                {
                    title: 'Living Untethered: Beyond the Human Predicament',
                    author: 'Michael A. Singer',
                    cover: 'https://covers.openlibrary.org/b/id/12769746-L.jpg'
                },
                {
                    title: 'Letters from a Stoic',
                    author: 'Seneca',
                    cover: 'https://covers.openlibrary.org/b/id/103759-L.jpg'
                },
                {
                    title: 'There Is No Antimemetics Division',
                    author: 'qntm',
                    cover: 'https://books.google.com/books/content?id=rGxMEQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
                },
                {
                    title: 'Untypical: How the World Isn’t Built for Autistic People and What We Should All Do About it',
                    author: 'Pete Wharmby',
                    cover: 'https://covers.openlibrary.org/b/id/12856524-L.jpg'
                },
                {
                    title: 'Antifragile: Things That Gain from Disorder',
                    author: 'Nassim Nicholas Taleb',
                    cover: 'https://covers.openlibrary.org/b/id/9180157-L.jpg'
                },
                {
                    title: 'The Selfish Gene',
                    author: 'Richard Dawkins',
                    cover: 'https://covers.openlibrary.org/b/id/133936-L.jpg'
                },
                {
                    title: 'White Nights',
                    author: 'Fyodor Dostoevsky',
                    cover: 'https://books.google.com/books/content?id=dbqwEQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
                },
                {
                    title: 'The Wright Brothers',
                    author: 'David McCullough',
                    cover: 'https://covers.openlibrary.org/b/id/8969538-L.jpg'
                },
                {
                    title: 'Steal Like an Artist: 10 Things Nobody Told You About Being Creative',
                    author: 'Austin Kleon',
                    cover: 'https://covers.openlibrary.org/b/id/7244512-L.jpg'
                },
                {
                    title: 'No Longer Human',
                    author: 'Osamu Dazai',
                    cover: 'https://covers.openlibrary.org/b/id/14611513-L.jpg'
                },
                {
                    title: 'The Sorrows of Young Werther. Novella',
                    author: 'Johann Wolfgang von Goethe',
                    cover: 'https://covers.openlibrary.org/b/id/7187281-L.jpg'
                },
                {
                    title: 'Leonardo da Vinci',
                    author: 'Walter Isaacson',
                    cover: 'https://covers.openlibrary.org/b/id/8087691-L.jpg'
                },
                {
                    title: 'Conjectures and Refutations: The Growth of Scientific Knowledge',
                    author: 'Karl Popper',
                    cover: 'https://covers.openlibrary.org/b/id/267020-L.jpg'
                },
                {
                    title: 'Scientific Advertising',
                    author: 'Claude C. Hopkins',
                    cover: 'https://covers.openlibrary.org/b/id/15057974-L.jpg'
                },
                {
                    title: 'The Black Swan: The Impact of the Highly Improbable',
                    author: 'Nassim Nicholas Taleb',
                    cover: 'https://covers.openlibrary.org/b/id/5721840-L.jpg'
                },
                {
                    title: 'Man and His Symbols',
                    author: 'C.G. Jung',
                    cover: 'https://books.google.com/books/content?id=PQgrkJgkKDcC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
                },
                {
                    title: 'The Fabric of Reality: The Science of Parallel Universes--and Its Implications',
                    author: 'David Deutsch',
                    cover: 'https://covers.openlibrary.org/b/id/452204-L.jpg'
                },
                {
                    title: 'Penguin Classics Faust Part One by Goethe Johann Von',
                    author: 'Johann Wolfgang von Goethe',
                    cover: 'https://covers.openlibrary.org/b/id/6499459-L.jpg'
                },
                {
                    title: 'The Unbearable Lightness of Being',
                    author: 'Milan Kundera',
                    cover: 'https://books.google.com/books/content?id=Ufv_DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
                },
                {
                    title: 'Twilight of the Idols, or How to Philosophize with a Hammer',
                    author: 'Friedrich Nietzsche',
                    cover: 'https://covers.openlibrary.org/b/id/3857803-L.jpg'
                },
                {
                    title: 'The Time Machine',
                    author: 'H.G. Wells',
                    cover: 'https://books.google.com/books/content?id=Yzt4Mwo8BbkC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
                },
                {
                    title: 'The Old Man and the Sea',
                    author: 'Ernest Hemingway',
                    cover: 'https://covers.openlibrary.org/b/id/463307-L.jpg'
                },
                {
                    title: 'Steve Jobs',
                    author: 'Walter Isaacson',
                    cover: 'https://covers.openlibrary.org/b/id/12374726-L.jpg'
                },
                {
                    title: 'The Law',
                    author: 'Frédéric Bastiat',
                    cover: 'https://covers.openlibrary.org/b/id/8819903-L.jpg'
                },
                {
                    title: 'Poor Charlie\'s Almanack: The Wit and Wisdom of Charles T. Munger',
                    author: 'Charles T. Munger',
                    cover: 'https://covers.openlibrary.org/b/id/8337563-L.jpg'
                }
            ]
        },
        {
            year: 2024,
            count: 43,
            books: [
                {
                    title: 'Einstein: His Life and Universe',
                    author: 'Walter Isaacson',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780743264747-L.jpg'
                },
                {
                    title: 'Fooled by Randomness',
                    author: 'Nassim Nicholas Taleb',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780812975215-L.jpg'
                },
                {
                    title: 'The Origin of Consciousness',
                    author: 'Julian Jaynes',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780618057078-L.jpg'
                },
                {
                    title: 'Benjamin Franklin',
                    author: 'Walter Isaacson',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780684807614-L.jpg'
                },
                {
                    title: 'Capitalism and Freedom',
                    author: 'Milton Friedman',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780226734798-L.jpg'
                },
                {
                    title: 'The Republic',
                    author: 'Plato',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780140455113-L.jpg'
                },
                {
                    title: 'The Wealth of Nations',
                    author: 'Adam Smith',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780140436150-L.jpg'
                },
                {
                    title: 'From Third World to First',
                    author: 'Lee Kuan Yew',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780060197766-L.jpg'
                },
                {
                    title: 'Parkinson\'s Law',
                    author: 'C. Northcote Parkinson',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780395291313-L.jpg'
                },
                {
                    title: 'I, Robot',
                    author: 'Isaac Asimov',
                    cover: 'https://books.google.com/books/content?id=2vnbMzYXBQsC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
                },
                {
                    title: 'The Laws of Thermodynamics',
                    author: 'Peter Atkins',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780199572199-L.jpg'
                },
                {
                    title: 'The Almanack of Naval Ravikant',
                    author: 'Eric Jorgenson',
                    cover: 'https://covers.openlibrary.org/b/isbn/9781544514215-L.jpg'
                },
                {
                    title: 'Modern Man in Search of a Soul',
                    author: 'C.G. Jung',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780156612067-L.jpg'
                },
                {
                    title: 'The Death of Ivan Ilych',
                    author: 'Leo Tolstoy',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780307951335-L.jpg'
                },
                {
                    title: 'Siddhartha',
                    author: 'Hermann Hesse',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780553208849-L.jpg'
                },
                {
                    title: 'The Little Prince',
                    author: 'Antoine de Saint-Exupéry',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg'
                },
                {
                    title: 'The Truce',
                    author: 'Mario Benedetti',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780141396859-L.jpg'
                },
                {
                    title: 'The Conquest of Happiness',
                    author: 'Bertrand Russell',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780415378475-L.jpg'
                },
                {
                    title: 'The Beginning of Infinity',
                    author: 'David Deutsch',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780143121350-L.jpg'
                },
                {
                    title: 'Flowers for Algernon',
                    author: 'Daniel Keyes',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780156030304-L.jpg'
                },
                {
                    title: 'Bullshit Jobs',
                    author: 'David Graeber',
                    cover: 'https://covers.openlibrary.org/b/isbn/9781501143335-L.jpg'
                },
                {
                    title: 'The Stranger',
                    author: 'Albert Camus',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780679720201-L.jpg'
                },
                {
                    title: 'We',
                    author: 'Yevgeny Zamyatin',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780143136293-L.jpg'
                },
                {
                    title: 'The Rational Male',
                    author: 'Rollo Tomassi',
                    cover: 'https://covers.openlibrary.org/b/isbn/9781492777861-L.jpg'
                },
                {
                    title: 'The Bed of Procrustes',
                    author: 'Nassim Nicholas Taleb',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780812982404-L.jpg'
                },
                {
                    title: 'Skin in the Game',
                    author: 'Nassim Nicholas Taleb',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780425284643-L.jpg'
                },
                {
                    title: 'The WEIRDest People in the World',
                    author: 'Joseph Henrich',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780374173227-L.jpg'
                },
                {
                    title: 'Things Fall Apart',
                    author: 'Chinua Achebe',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780385474542-L.jpg'
                },
                {
                    title: 'Poems for the Lost',
                    author: 'Exurb1a',
                    cover: 'https://covers.openlibrary.org/b/isbn/9798362149598-L.jpg'
                },
                {
                    title: 'Meditations',
                    author: 'Marcus Aurelius',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780812968255-L.jpg'
                },
                {
                    title: 'The Lessons of History',
                    author: 'Will Durant',
                    cover: 'https://covers.openlibrary.org/b/isbn/9781439149959-L.jpg'
                },
                {
                    title: 'Animal Farm',
                    author: 'George Orwell',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780451526342-L.jpg'
                },
                {
                    title: 'The Prince',
                    author: 'Niccolò Machiavelli',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780140449150-L.jpg'
                },
                {
                    title: 'The Richest Man in Babylon',
                    author: 'George S. Clason',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780451205360-L.jpg'
                },
                {
                    title: 'Propaganda',
                    author: 'Edward L. Bernays',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780804615112-L.jpg'
                },
                {
                    title: 'Man\'s Search for Himself',
                    author: 'Rollo May',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780393333152-L.jpg'
                },
                {
                    title: 'The Anthology of Balaji',
                    author: 'Eric Jorgenson',
                    cover: 'https://covers.openlibrary.org/b/isbn/9781544542911-L.jpg'
                },
                {
                    title: 'How to Find Fulfilling Work',
                    author: 'Roman Krznaric',
                    cover: 'https://covers.openlibrary.org/b/isbn/9781250030696-L.jpg'
                },
                {
                    title: 'The Player of Games',
                    author: 'Iain M. Banks',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780316095860-L.jpg'
                },
                {
                    title: 'Wanting',
                    author: 'Luke Burgis',
                    cover: 'https://covers.openlibrary.org/b/isbn/9781250262486-L.jpg'
                },
                {
                    title: 'Same as Ever',
                    author: 'Morgan Housel',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780593332702-L.jpg'
                },
                {
                    title: 'Notes from Underground',
                    author: 'Fyodor Dostoevsky',
                    cover: 'https://covers.openlibrary.org/b/isbn/9780679734529-L.jpg'
                },
                {
                    title: 'As a Man Thinketh',
                    author: 'James Allen',
                    cover: 'https://covers.openlibrary.org/b/isbn/9781585426386-L.jpg'
                }
            ]
        }
    ];

    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) {
            element.className = className;
        }
        if (text) {
            element.textContent = text;
        }
        return element;
    }

    function createBookCard(book, year, href) {
        const card = document.createElement(href ? 'a' : 'div');
        card.className = href ? 'book-item book-item-link' : 'book-item';
        card.setAttribute('aria-label', `${book.title} by ${book.author}`);
        if (href) {
            card.href = href;
        }

        const cover = createElement(
            'div',
            book.cover ? 'book-cover has-image' : 'book-cover book-cover-placeholder'
        );

        if (book.cover) {
            const image = document.createElement('img');
            image.src = book.cover;
            image.alt = '';
            image.loading = 'lazy';
            image.decoding = 'async';
            image.referrerPolicy = 'no-referrer';
            image.addEventListener('error', () => {
                image.remove();
                cover.classList.remove('has-image');
                cover.classList.add('book-cover-placeholder');
            });
            cover.appendChild(image);
        }

        const spine = createElement('div', 'book-spine');
        const info = createElement('div', 'book-info');
        const kicker = createElement('span', 'book-kicker', String(year));
        const title = createElement('span', 'b-title', book.title);
        const author = createElement('span', 'b-author', book.author);

        info.append(kicker, title, author);
        cover.append(spine, info);
        card.appendChild(cover);

        return card;
    }

    function renderHomepagePreview() {
        const count = document.getElementById('books-preview-count');
        const label = document.getElementById('books-preview-label');
        const grid = document.getElementById('books-preview-grid');

        if (!count || !label || !grid) {
            return;
        }

        const currentSection = bookSections[0];
        count.textContent = String(currentSection.count);
        label.textContent = currentSection.previewLabel;

        grid.innerHTML = '';
        currentSection.books.slice(0, 4).forEach((book) => {
            grid.appendChild(createBookCard(book, currentSection.year, 'books.html'));
        });
    }

    function createYearSection(entry) {
        const section = createElement('section', 'books-year-section');
        section.id = `books-${entry.year}`;

        const header = createElement('div', 'books-year-header');
        const title = createElement('h3', 'books-year-title', String(entry.year));
        const meta = createElement('span', 'books-year-meta', `${entry.count} books`);
        const grid = createElement('div', 'book-grid');

        header.append(title, meta);

        entry.books.forEach((book) => {
            grid.appendChild(createBookCard(book, entry.year));
        });

        section.append(header, grid);
        return section;
    }

    function renderBooksPage() {
        const archive = document.getElementById('books-archive');
        if (!archive) {
            return;
        }

        archive.innerHTML = '';
        bookSections.forEach((entry) => {
            archive.appendChild(createYearSection(entry));
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderHomepagePreview();
        renderBooksPage();
    });
})();
