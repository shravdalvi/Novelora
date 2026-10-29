import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

describe('Novelora Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment;

  const PROJECT_ID = 'novelora-test-rules';
  const RULES_PATH = path.resolve(__dirname, '../firestore.rules');

  beforeAll(async () => {
    const rules = fs.readFileSync(RULES_PATH, 'utf8');

    // Parse host and port if FIRESTORE_EMULATOR_HOST is set
    const hostPort = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    const [host, portStr] = hostPort.split(':');
    const port = parseInt(portStr, 10) || 8080;

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules,
        host,
        port,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    // Clear and seed base test fixtures
    await testEnv.clearFirestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      // Seed Published Book
      await setDoc(doc(db, 'books', 'book-pub'), {
        title: 'Echoes of the Realm',
        visibility: 'published',
        status: 'ongoing',
        chapterCount: 3,
      });

      // Seed Draft Book
      await setDoc(doc(db, 'books', 'book-draft'), {
        title: 'Hidden Manuscript',
        visibility: 'draft',
        status: 'ongoing',
        chapterCount: 1,
      });

      // Seed Published Chapter 1 (Guest accessible)
      await setDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-1'), {
        chapterNumber: 1,
        title: 'The Beginning',
        status: 'published',
      });

      // Seed Published Chapter 2 (Signed-in users only)
      await setDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-2'), {
        chapterNumber: 2,
        title: 'The Journey',
        status: 'published',
      });

      // Seed Draft Chapter 3 (Admin only)
      await setDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-3'), {
        chapterNumber: 3,
        title: 'Unfinished Tale',
        status: 'draft',
      });

      // Seed Reader Profiles
      await setDoc(doc(db, 'users', 'reader1'), {
        name: 'Reader One',
        email: 'reader1@example.com',
        role: 'reader',
      });
      await setDoc(doc(db, 'users', 'reader2'), {
        name: 'Reader Two',
        email: 'reader2@example.com',
        role: 'reader',
      });

      // Seed Bookmarks & Progress for reader1
      await setDoc(doc(db, 'users', 'reader1', 'bookmarks', 'book-pub'), {
        bookId: 'book-pub',
      });
      await setDoc(doc(db, 'users', 'reader1', 'progress', 'book-pub'), {
        lastChapter: 1,
        scrollPosition: 200,
      });

      // Seed Comments on Chapter 1
      await setDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-1', 'comments', 'comm-reader1'), {
        userId: 'reader1',
        text: 'Loved this chapter!',
      });
      await setDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-1', 'comments', 'comm-reader2'), {
        userId: 'reader2',
        text: 'Excited for the next one.',
      });

      // Seed Subscriber
      await setDoc(doc(db, 'subscribers', 'sub-1'), {
        email: 'newsletter@example.com',
      });
    });
  });

  // =========================================================================
  // 1. Guest (Unauthenticated) Tests
  // =========================================================================
  describe('Guest (Unauthenticated)', () => {
    const getGuestDb = () => testEnv.unauthenticatedContext().firestore();

    test('CAN read published book', async () => {
      const db = getGuestDb();
      await assertSucceeds(getDoc(doc(db, 'books', 'book-pub')));
    });

    test('CANNOT read draft book', async () => {
      const db = getGuestDb();
      await assertFails(getDoc(doc(db, 'books', 'book-draft')));
    });

    test('CAN read published chapter 1', async () => {
      const db = getGuestDb();
      await assertSucceeds(getDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-1')));
    });

    test('CANNOT read published chapter 2 (requires login)', async () => {
      const db = getGuestDb();
      await assertFails(getDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-2')));
    });

    test('CANNOT write to books', async () => {
      const db = getGuestDb();
      await assertFails(
        setDoc(doc(db, 'books', 'guest-book'), {
          title: 'Guest Manuscript',
          visibility: 'published',
        })
      );
    });

    test('CAN create subscriber with valid email', async () => {
      const db = getGuestDb();
      await assertSucceeds(
        setDoc(doc(db, 'subscribers', 'sub-guest-1'), {
          email: 'valid-guest@domain.com',
        })
      );
    });

    test('CANNOT create subscriber with invalid email', async () => {
      const db = getGuestDb();
      await assertFails(
        setDoc(doc(db, 'subscribers', 'sub-guest-bad'), {
          email: 'not-an-email',
        })
      );
    });

    test('CANNOT read subscribers list', async () => {
      const db = getGuestDb();
      await assertFails(getDoc(doc(db, 'subscribers', 'sub-1')));
    });
  });

  // =========================================================================
  // 2. Reader (Authenticated, No Admin Claim) Tests
  // =========================================================================
  describe('Reader (Authenticated, regular user)', () => {
    const getReaderDb = () => testEnv.authenticatedContext('reader1').firestore();
    const getOtherReaderDb = () => testEnv.authenticatedContext('reader2').firestore();

    test('CAN read published books and published chapters (1 and 2+)', async () => {
      const db = getReaderDb();
      await assertSucceeds(getDoc(doc(db, 'books', 'book-pub')));
      await assertSucceeds(getDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-1')));
      await assertSucceeds(getDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-2')));
    });

    test('CANNOT read draft chapter', async () => {
      const db = getReaderDb();
      await assertFails(getDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-3')));
    });

    test('CANNOT read draft book', async () => {
      const db = getReaderDb();
      await assertFails(getDoc(doc(db, 'books', 'book-draft')));
    });

    test('CANNOT write to books or chapters', async () => {
      const db = getReaderDb();
      await assertFails(
        setDoc(doc(db, 'books', 'reader-book'), {
          title: 'Reader Book',
          visibility: 'published',
        })
      );
      await assertFails(
        setDoc(doc(db, 'books', 'book-pub', 'chapters', 'reader-ch'), {
          chapterNumber: 4,
          title: 'Reader Chapter',
          status: 'published',
        })
      );
    });

    test('CAN read/write own bookmarks and progress', async () => {
      const db = getReaderDb();
      // Read own bookmark
      await assertSucceeds(getDoc(doc(db, 'users', 'reader1', 'bookmarks', 'book-pub')));

      // Write own bookmark
      await assertSucceeds(
        setDoc(doc(db, 'users', 'reader1', 'bookmarks', 'new-book'), {
          bookId: 'new-book',
        })
      );

      // Read own progress
      await assertSucceeds(getDoc(doc(db, 'users', 'reader1', 'progress', 'book-pub')));

      // Write own progress
      await assertSucceeds(
        setDoc(doc(db, 'users', 'reader1', 'progress', 'book-pub'), {
          lastChapter: 2,
          scrollPosition: 450,
        })
      );

      // Write own likes
      await assertSucceeds(
        setDoc(doc(db, 'users', 'reader1', 'likes', 'ch-1'), {
          createdAt: '2026-01-01',
        })
      );
    });

    test('CANNOT read other user bookmarks or progress', async () => {
      const db = getReaderDb();
      // Try to read reader2's bookmarks
      await assertFails(getDoc(doc(db, 'users', 'reader2', 'bookmarks', 'book-pub')));

      // Try to write to reader2's bookmarks
      await assertFails(
        setDoc(doc(db, 'users', 'reader2', 'bookmarks', 'book-pub'), {
          bookId: 'book-pub',
        })
      );
    });

    test('CAN create comments on published chapters with valid fields', async () => {
      const db = getReaderDb();
      await assertSucceeds(
        setDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-1', 'comments', 'new-comment'), {
          userId: 'reader1',
          text: 'This is a valid constructive comment.',
        })
      );
    });

    test('CANNOT create comments with someone else userId or empty text', async () => {
      const db = getReaderDb();
      // Spoofed userId
      await assertFails(
        setDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-1', 'comments', 'spoofed-comment'), {
          userId: 'reader2',
          text: 'I am pretending to be reader2.',
        })
      );

      // Empty text
      await assertFails(
        setDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-1', 'comments', 'empty-comment'), {
          userId: 'reader1',
          text: '',
        })
      );
    });

    test('CAN delete own comments', async () => {
      const db = getReaderDb();
      await assertSucceeds(
        deleteDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-1', 'comments', 'comm-reader1'))
      );
    });

    test('CANNOT delete other user comments', async () => {
      const db = getOtherReaderDb();
      // reader2 trying to delete reader1's comment
      await assertFails(
        deleteDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-1', 'comments', 'comm-reader1'))
      );
    });

    test('CANNOT update comments (immutable)', async () => {
      const db = getReaderDb();
      await assertFails(
        updateDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-1', 'comments', 'comm-reader1'), {
          text: 'Edited comment text.',
        })
      );
    });

    test('CANNOT change own role in user profile', async () => {
      const db = getReaderDb();
      // Attempting privilege escalation
      await assertFails(
        updateDoc(doc(db, 'users', 'reader1'), {
          role: 'admin',
        })
      );

      // Can update regular profile field (e.g. name)
      await assertSucceeds(
        updateDoc(doc(db, 'users', 'reader1'), {
          name: 'Reader One Updated',
        })
      );
    });

    test('CANNOT read subscribers list', async () => {
      const db = getReaderDb();
      await assertFails(getDoc(doc(db, 'subscribers', 'sub-1')));
    });
  });

  // =========================================================================
  // 3. Admin (Authenticated, admin=true Claim) Tests
  // =========================================================================
  describe('Admin (Authenticated with admin=true claim)', () => {
    const getAdminDb = () => testEnv.authenticatedContext('admin1', { admin: true }).firestore();

    test('CAN read ALL books (including drafts)', async () => {
      const db = getAdminDb();
      await assertSucceeds(getDoc(doc(db, 'books', 'book-pub')));
      await assertSucceeds(getDoc(doc(db, 'books', 'book-draft')));
      await assertSucceeds(getDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-3')));
    });

    test('CAN write to books and chapters', async () => {
      const db = getAdminDb();
      // Write book
      await assertSucceeds(
        setDoc(doc(db, 'books', 'new-admin-book'), {
          title: 'The Admin Chronicles',
          visibility: 'published',
          status: 'ongoing',
        })
      );

      // Write chapter
      await assertSucceeds(
        setDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-4'), {
          chapterNumber: 4,
          title: 'The Next Level',
          status: 'published',
        })
      );
    });

    test('CAN delete any comment', async () => {
      const db = getAdminDb();
      // Admin deletes reader1's comment
      await assertSucceeds(
        deleteDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-1', 'comments', 'comm-reader1'))
      );
      // Admin deletes reader2's comment
      await assertSucceeds(
        deleteDoc(doc(db, 'books', 'book-pub', 'chapters', 'ch-1', 'comments', 'comm-reader2'))
      );
    });

    test('CAN read subscribers', async () => {
      const db = getAdminDb();
      await assertSucceeds(getDoc(doc(db, 'subscribers', 'sub-1')));
    });
  });
});
