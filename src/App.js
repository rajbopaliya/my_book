import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocs, query, where, addDoc, updateDoc, Timestamp, collection, deleteDoc } from "firebase/firestore";
import './index.css';

const firebaseConfig = {
  apiKey: "AIzaSyCr6BpTJQUEf7ILlorewkPZdmK_PHEVJnM",
  authDomain: "my-read-book.firebaseapp.com",
  projectId: "my-read-book",
  storageBucket: "my-read-book.appspot.com",
  messagingSenderId: "773431751079",
  appId: "1:773431751079:web:02127862c21a9061a9c682",
  measurementId: "G-309P2VCTT6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


async function setData(email, BookName, AuthorName, StartDate, EndDate = "") {
  try {
    const collectionRef = collection(db, 'ReadingList');
    await addDoc(collectionRef, {
      email,
      BookName,
      AuthorName,
      StartDate: Timestamp.fromDate(new Date(StartDate)),
      EndDate: EndDate !== "" ? Timestamp.fromDate(new Date(EndDate)) : null
    });
    console.log("Data Added");
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
}


async function getDataFB(emailId) {
  try {
    console.log("List of Books of: ", emailId);
    const result = [];
    const BookList = collection(db, "ReadingList");
    const dataSnapshot = await getDocs(query(BookList, where('email', "==", emailId)));
    dataSnapshot.forEach(doc => {
      console.log(doc.id, '=>', doc.data());
      result.push({ id: doc.id, ...doc.data() });
    });
    return result;
  } catch (error) {
    console.error("Error getting document: ", error);
    throw error;
  }
}


async function updateEndDate(id, newEndDate) {
  try {
    const bookDocRef = doc(db, 'ReadingList', id); 
    await updateDoc(bookDocRef, {
      EndDate: newEndDate !== "" ? Timestamp.fromDate(new Date(newEndDate)) : null
    });
    console.log("Document updated with ID: ", id);
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
  
}

async function deleteBook(id) {
  try {
    const bookDocRef = doc(db, 'ReadingList', id); 
    await deleteDoc(bookDocRef);
    console.log("Document deleted with ID: ", id);
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw error;
  }
}



function App() {
  const [showPopup, setShowPopup] = useState(true);
  const [email, setEmail] = useState("");
  const [newBookPopUp, setNewBookPopUp] = useState(false);
  const [BookName, setBookName] = useState("");
  const [AuthorName, setAuthorName] = useState("");
  const [StartDate, setStartDate] = useState("");
  const [EndDate, setEndDate] = useState("");
  const [BookList, setBookList] = useState([]);

  // useEffect(() => { 

  // }, []);

  useEffect(() => {
    if (email && !showPopup) {
      getDataFB(email).then(data => {
        data.map(ele => {
          const StartDate = new Date(ele.StartDate.seconds * 1000 + ele.StartDate.nanoseconds / 1000000);
          ele["StartDate"] = StartDate.toDateString();
          if (ele.EndDate !== null) {
            const EndDate = new Date(ele.EndDate.seconds * 1000 + ele.EndDate.nanoseconds / 1000000);
            ele["EndDate"] = EndDate.toDateString();
          } else {
            ele["EndDate"] = "";
          }
          return ele;
        });
        setBookList(data);
      });
    }
  }, [showPopup]);


  const handleUpdateEndDate = async (id) => {
    setEndDate("");
    const newEndDate = await promptUserForDate("Enter End Date (YYYY-MM-DD):");
    if (newEndDate !== "") {
      await updateEndDate(id, newEndDate);
      setBookList(BookList.map(book => {
        if (book.id === id) {
          return {
            ...book,
            EndDate: newEndDate !== "" ? new Date(newEndDate).toDateString() : ""
          };
        } else {
          return book;
        }
      }));
    }
  };

   const handleDelete = async (id) => {
    try {
      await deleteBook(id);
      const updatedBookList = BookList.filter(book => book.id !== id);
      setBookList(updatedBookList);
      console.log("Book deleted successfully.");
    } catch (error) {
      console.error("Error deleting book:", error);
    }
  };

  const promptUserForDate = (message) => {
    return new Promise((resolve) => {
      const userInput = prompt(message);
      if (userInput !== null) {
        resolve(userInput);
      } else {
        resolve("");
      }
    });
  };

  const closePopup = () => {
    setNewBookPopUp(false);
    setBookName("");
    setAuthorName("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div>
      {showPopup &&
        <div className="fixed inset-0 flex items-center justify-center dark:bg-slate-400 dark:text-white ">
          <div className="bg-white p-8 rounded-lg shadow-lg dark:bg-slate-900 dark:text-white ">
            <h2 className="text-xl mb-4 pl-5 font-bold ">Enter Your Email</h2>
            <form onSubmit={(event) => {
              event.preventDefault();
              setShowPopup(false);
            }} className="flex flex-col">
              <label className="input input-bordered flex items-center gap-2 text-black">
                <input type="email" className="grow text-white	" onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" required />
              </label>
              <button type="submit" className="btn mt-10 btn-success">Submit</button>
            </form>
          </div>
        </div>
      }
      {email &&
        <div className='bg-slate-500 w-screen h-screen'>
          <div className='flex pt-32'>
            <button className='m-auto bg-slate-800 w-60 p-1 text-white	' onClick={() => setNewBookPopUp(true)}>Add New Book</button>
            <br /><br />
          </div>
          {BookList &&
            <div className='flex flex-col justify-between'>
              <div className='m-auto'>
                <button className='bg-slate-800 w-60 p-1 text-white	'>Book Name</button>
                <button className='m-auto bg-slate-800 w-60 p-1 text-white	'>Author Name</button>
                <button className='m-auto bg-slate-800 w-60 p-1 text-white	'>Start Date</button>
                <button className='m-auto bg-slate-800 w-60 p-1 text-white	'>Ending Date</button>
                <button className='m-auto bg-slate-800 w-60 p-1 text-white	'>Delete Book</button>
              </div>
              {BookList.map((ele) => {
                return (
                  <div className='m-auto' key={ele.id}>
                    <button className='m-auto bg-slate-800 w-60 p-1 text-white	'>{ele.BookName}</button>
                    <button className='m-auto bg-slate-800 w-60 p-1 text-white	'>{ele.AuthorName}</button>
                    <button className='m-auto bg-slate-800 w-60 p-1 text-white	'>{ele.StartDate}</button>
                    <button className='m-auto bg-slate-800 w-60 p-1 text-white	' onClick={() => handleUpdateEndDate(ele.id)}>
                      {ele.EndDate === "" ? "Update End Date" : ele.EndDate}
                    </button>
                    <button className='m-auto bg-slate-800 w-60 p-1 text-white	' onClick={() => handleDelete(ele.id)}>Delete Book</button>
                  </div>
                );
              })}
            </div>
          }
        </div>
      }
      {newBookPopUp &&
        <div className="fixed inset-0 flex items-center justify-center dark:bg-slate-900 dark:text-white ">
          <div className="bg-white p-8 rounded-lg shadow-lg dark:bg-slate-900 dark:text-white ">
          <button className="cursor-pointer btn btn-sm   btn-circle btn-ghost relative top-0 right-0" onClick={closePopup}>✕</button>
            <h2 className="text-xl mb-4 pl-10 font-bold ">Enter Book Details</h2>
            <form onSubmit={(event) => {
              event.preventDefault();
              setData(email, BookName, AuthorName, StartDate, EndDate);
              closePopup(); 
              setBookList([...BookList, { BookName, AuthorName, StartDate, EndDate, id: BookList.length + 1 }]);

            }} className="flex flex-col">
              <label className="input-bordered flex items-center gap-2 text-white m-1">Book Name</label>
              <input type="text" className="grow dark:bg-slate-900 dark:text-white border-2 rounded p-1" value={BookName} onChange={(event) => setBookName(event.target.value)} placeholder="Half Girlfriend" required />
              <label className="input-bordered flex items-center gap-2 text-white m-1">Author's Name</label>
              <input type="text" className="grow dark:bg-slate-900 dark:text-white border-2 rounded p-1" value={AuthorName} onChange={(event) => setAuthorName(event.target.value)} placeholder="Chetan Bhagat" required />
              <label className="input-bordered flex items-center gap-2 text-white m-1">Start Date</label>
              <input type="date" className="dark:bg-slate-900 dark:text-white border-2 rounded p-1" value={StartDate} onChange={(event) => setStartDate(event.target.value)} required />
              <label className="input-bordered flex items-center gap-2 text-white m-1">End Date</label>
              <input type="date" className="dark:bg-slate-900 dark:text-white border-2 rounded p-1" value={EndDate} onChange={(event) => setEndDate(event.target.value)} />
              <button type="submit" className="btn mt-10 btn-success">Submit</button>
            </form>
          </div>
        </div>
      }
    </div>
  );
}

export default App;
