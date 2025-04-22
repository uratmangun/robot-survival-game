'use client';
import { useState } from 'react';

export default function CrudDemo() {
  const [collection, setCollection] = useState('demo');
  const [createFields, setCreateFields] = useState<{key:string,value:string}[]>([{key:'',value:''}]);
  const [filterFields, setFilterFields] = useState<{key:string,value:string}[]>([{key:'',value:''}]);
  const [updateQueryFields, setUpdateQueryFields] = useState<{key:string,value:string}[]>([{key:'',value:''}]);
  const [updateDataFields, setUpdateDataFields] = useState<{key:string,value:string}[]>([{key:'',value:''}]);
  const [deleteFields, setDeleteFields] = useState<{key:string,value:string}[]>([{key:'',value:''}]);
  const parseValue = (v: string): any => { try { return JSON.parse(v); } catch { return v; } };

  const [createRes, setCreateRes] = useState<any>(null);
  const [readRes, setReadRes] = useState<any[]>([]);
  const [updateRes, setUpdateRes] = useState<any>(null);
  const [deleteRes, setDeleteRes] = useState<any>(null);
  const [deleteAllRes, setDeleteAllRes] = useState<any>(null);
  const [collectionsList, setCollectionsList] = useState<string[]>([]);
  const [listData, setListData] = useState<any[]>([]);

  const handleCreate = async () => {
    const dataObj: any = {}; createFields.forEach(({key,value}) => key && (dataObj[key] = parseValue(value)));
    const res = await fetch('/api/create-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, data: dataObj }),
    });
    const json = await res.json();
    setCreateRes(json);
  };

  const handleRead = async () => {
    const filtersObj: any = {}; filterFields.forEach(({key,value}) => key && (filtersObj[key] = parseValue(value)));
    const params = new URLSearchParams({ collection });
    Object.entries(filtersObj).forEach(([k,v]) => params.set(k, String(v)));
    const res = await fetch(`/api/read-data?${params.toString()}`);
    const json = await res.json();
    setReadRes(json.results);
  };

  const handleUpdate = async () => {
    const queryObj: any = {}; updateQueryFields.forEach(({key,value}) => key && (queryObj[key] = parseValue(value)));
    const updObj: any = {}; updateDataFields.forEach(({key,value}) => key && (updObj[key] = parseValue(value)));
    const res = await fetch('/api/update-data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, query: queryObj, updateData: updObj }),
    });
    const json = await res.json();
    setUpdateRes(json);
  };

  const handleDelete = async () => {
    const queryObj: any = {}; deleteFields.forEach(({key,value}) => key && (queryObj[key] = parseValue(value)));
    const res = await fetch('/api/delete-data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, query: queryObj }),
    });
    const json = await res.json();
    setDeleteRes(json);
  };

  const handleDeleteAll = async () => {
    const res = await fetch('/api/delete-data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, query: {} }),
    });
    const json = await res.json();
    setDeleteAllRes(json);
  };

  const handleList = async () => {
    const res = await fetch('/api/list-collections');
    const json = await res.json();
    setCollectionsList(json.collections);
  };

  const handleListData = async () => {
    const res = await fetch(`/api/list-data?collection=${collection}`);
    const json = await res.json();
    setListData(json.results);
  };

  return (
    <div className="p-8 space-y-8 text-black [&_button]:cursor-pointer">
      <h1 className="text-2xl font-bold">CRUD Demo</h1>
      <div>
        <label className="mr-2">Collection:</label>
        <input className="border px-2 py-1" value={collection} onChange={e => setCollection(e.target.value)} />
      </div>

      <section className="border p-4 rounded space-y-2">
        <h2 className="font-semibold">Collections</h2>
        <button className="bg-purple-500 text-white px-4 py-2 rounded" onClick={handleList}>List</button>
        <ul className="list-disc ml-5">
          {collectionsList.map(c => <li key={c}>{c}</li>)}
        </ul>
      </section>

      <section className="border p-4 rounded space-y-2">
        <h2 className="font-semibold">Create</h2>
        {createFields.map((f,i) => (
          <div key={i} className="flex space-x-2">
            <input type="text" placeholder="Key" className="border p-1 flex-1" value={f.key} onChange={e => {
              const arr = [...createFields]; arr[i].key = e.target.value; setCreateFields(arr);
            }} />
            <input type="text" placeholder="Value" className="border p-1 flex-1" value={f.value} onChange={e => {
              const arr = [...createFields]; arr[i].value = e.target.value; setCreateFields(arr);
            }} />
            <button className="text-red-500" onClick={() => setCreateFields(createFields.filter((_,idx) => idx!==i))}>Remove</button>
          </div>
        ))}
        <button onClick={() => setCreateFields([...createFields, {key:'',value:''}])} className="text-blue-500 block mb-2">+ Add Field</button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded block" onClick={handleCreate}>Create</button>
        {createRes && <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(createRes, null, 2)}</pre>}
      </section>

      <section className="border p-4 rounded space-y-2">
        <h2 className="font-semibold">Read</h2>
        {filterFields.map((f,i) => (
          <div key={i} className="flex space-x-2">
            <input type="text" placeholder="Key" className="border p-1 flex-1" value={f.key} onChange={e => {
              const arr = [...filterFields]; arr[i].key = e.target.value; setFilterFields(arr);
            }} />
            <input type="text" placeholder="Value" className="border p-1 flex-1" value={f.value} onChange={e => {
              const arr = [...filterFields]; arr[i].value = e.target.value; setFilterFields(arr);
            }} />
            <button className="text-red-500" onClick={() => setFilterFields(filterFields.filter((_,idx) => idx!==i))}>Remove</button>
          </div>
        ))}
        <button onClick={() => setFilterFields([...filterFields, {key:'',value:''}])} className="text-green-500 block mb-2">+ Add Filter</button>
        <button className="bg-green-500 text-white px-4 py-2 rounded block" onClick={handleRead}>Read</button>
        <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(readRes, null, 2)}</pre>
      </section>

      <section className="border p-4 rounded space-y-2">
        <h2 className="font-semibold">Update</h2>
        {updateQueryFields.map((f,i) => (
          <div key={i} className="flex space-x-2">
            <input type="text" placeholder="Query Key" className="border p-1 flex-1" value={f.key} onChange={e => {
              const arr = [...updateQueryFields]; arr[i].key = e.target.value; setUpdateQueryFields(arr);
            }} />
            <input type="text" placeholder="Query Value" className="border p-1 flex-1" value={f.value} onChange={e => {
              const arr = [...updateQueryFields]; arr[i].value = e.target.value; setUpdateQueryFields(arr);
            }} />
            <button className="text-red-500" onClick={() => setUpdateQueryFields(updateQueryFields.filter((_,idx) => idx!==i))}>Remove</button>
          </div>
        ))}
        <button onClick={() => setUpdateQueryFields([...updateQueryFields, {key:'',value:''}])} className="text-yellow-500 block mb-2">+ Add Query Field</button>
        {updateDataFields.map((f,i) => (
          <div key={i} className="flex space-x-2">
            <input type="text" placeholder="Update Key" className="border p-1 flex-1" value={f.key} onChange={e => {
              const arr = [...updateDataFields]; arr[i].key = e.target.value; setUpdateDataFields(arr);
            }} />
            <input type="text" placeholder="Update Value" className="border p-1 flex-1" value={f.value} onChange={e => {
              const arr = [...updateDataFields]; arr[i].value = e.target.value; setUpdateDataFields(arr);
            }} />
            <button className="text-red-500" onClick={() => setUpdateDataFields(updateDataFields.filter((_,idx) => idx!==i))}>Remove</button>
          </div>
        ))}
        <button onClick={() => setUpdateDataFields([...updateDataFields, {key:'',value:''}])} className="text-yellow-500 block mb-2">+ Add Update Field</button>
        <button className="bg-yellow-500 text-white px-4 py-2 rounded block" onClick={handleUpdate}>Update</button>
        {updateRes && <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(updateRes, null, 2)}</pre>}
      </section>

      <section className="border p-4 rounded space-y-2">
        <h2 className="font-semibold">Delete</h2>
        {deleteFields.map((f,i) => (
          <div key={i} className="flex space-x-2">
            <input type="text" placeholder="Key" className="border p-1 flex-1" value={f.key} onChange={e => {
              const arr = [...deleteFields]; arr[i].key = e.target.value; setDeleteFields(arr);
            }} />
            <input type="text" placeholder="Value" className="border p-1 flex-1" value={f.value} onChange={e => {
              const arr = [...deleteFields]; arr[i].value = e.target.value; setDeleteFields(arr);
            }} />
            <button className="text-red-500" onClick={() => setDeleteFields(deleteFields.filter((_,idx) => idx!==i))}>Remove</button>
          </div>
        ))}
        <button onClick={() => setDeleteFields([...deleteFields, {key:'',value:''}])} className="text-red-500 block mb-2">+ Add Field</button>
        <button className="bg-red-500 text-white px-4 py-2 rounded block" onClick={handleDelete}>Delete</button>
        <button className="bg-red-700 text-white px-4 py-2 rounded block" onClick={handleDeleteAll}>Delete All Data</button>
        {deleteRes && <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(deleteRes, null, 2)}</pre>}
        {deleteAllRes && <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(deleteAllRes, null, 2)}</pre>}
      </section>

      <section className="border p-4 rounded space-y-2">
        <h2 className="font-semibold">List All Data</h2>
        <button className="bg-indigo-500 text-white px-4 py-2 rounded" onClick={handleListData}>List Data</button>
        <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(listData, null, 2)}</pre>
      </section>
    </div>
  );
}
