import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { saveAs } from 'file-saver';
import Sidebar from '../components/sidebar';
import { ToastContainer, toast } from "react-toastify";

const eldRows = ['Start', 'PickUp', 'Break', 'Dropoff'];

const statusRowMap = {
  'Start': 1,
  'Pickup': 2,
  'Break': 3,
  'Drop-off': 4,
  'Sleep': 5,
};

const ELDLog = () => {
  const { tripId } = useParams();
  const [logs, setLogs] = useState([]);

 

    useEffect(() => {
    const fetchELDLogs = async () => {
        try {
        const endpoint = tripId
            ? `${process.env.REACT_APP_BACKEND_URL}/api/eld-logs/${tripId}/`
            : `${process.env.REACT_APP_BACKEND_URL}/api/eld-logs/`;

        const res = await axios.get(endpoint, {
            headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        });

        const trips = res.data.trips || [];
        const processed = trips.map((trip) => {
            const stopSchedule = trip.stop_schedule || [];
            const logData = stopSchedule.map((stop, i) => {
            const timeStr = new Date(stop.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return {
                time: timeStr,
                rawTime: new Date(stop.time),
                status: stop.type,
                notes: `${stop.type} at ${stop.type === 'Pickup' ? trip.pickup_city : trip.dropoff_city}`,
            };
            });

            return {
            tripId: trip.id,
            date: new Date(trip.start_time).toLocaleDateString(),
            pickup: trip.pickup_city,
            dropoff: trip.dropoff_city,
            duration: trip.duration_hours,
            logData,
            };
        });

        setLogs(processed);
        } catch (err) {
        console.error(err);
        toast.error('Failed to fetch ELD logs.');
        }
    };

    fetchELDLogs();
    }, [tripId]);


const drawGraph = (logData) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');

  const tooltip = document.createElement('div');
  tooltip.style.position = 'absolute';
  tooltip.style.background = '#333';
  tooltip.style.color = '#fff';
  tooltip.style.padding = '4px 8px';
  tooltip.style.fontSize = '12px';
  tooltip.style.borderRadius = '4px';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.display = 'none';
  document.body.appendChild(tooltip);

  const redDots = [];

  if (!logData.length) return;

  const rawStart = new Date(logData[0].rawTime);
  const rawEnd = new Date(logData[logData.length - 1].rawTime);
  const minTime = new Date(rawStart.getTime() - 60 * 60 * 1000); // pad 1 hour
  const maxTime = new Date(rawEnd.getTime() + 60 * 60 * 1000);
  const totalMinutes = (maxTime - minTime) / (1000 * 60);

  // Horizontal rows
  eldRows.forEach((row, i) => {
    const y = 50 + i * 30;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.strokeStyle = '#000';
    ctx.stroke();
    ctx.font = '12px Arial';
    ctx.fillText(row, 5, y - 5);
  });

  // X-axis time labels every hour
  const labelInterval = 60;
  const labelCount = Math.floor(totalMinutes / labelInterval) + 1;
  for (let i = 0; i < labelCount; i++) {
    const labelTime = new Date(minTime.getTime() + i * labelInterval * 60 * 1000);
    const labelStr = labelTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const x = (i * labelInterval / totalMinutes) * canvas.width;

    ctx.beginPath();
    ctx.moveTo(x, 30);
    ctx.lineTo(x, canvas.height - 20);
    ctx.strokeStyle = '#ccc';
    ctx.stroke();
    ctx.font = '10px Arial';
    ctx.fillText(labelStr, x + 2, 20);
  }

  const getX = (date) => {
    const mins = (new Date(date) - minTime) / (1000 * 60);
    return (mins / totalMinutes) * canvas.width;
  };

  // Draw step-line and dots
  for (let i = 0; i < logData.length - 1; i++) {
    const curr = logData[i];
    const next = logData[i + 1];

    const currX = getX(curr.rawTime);
    const nextX = getX(next.rawTime);

    const currY = 30 + (statusRowMap[curr.status] ?? 0) * 30;
    const nextY = 30 + (statusRowMap[next.status] ?? 0) * 30;

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(currX, currY);
    ctx.lineTo(nextX, currY);
    ctx.strokeStyle = '#1D4ED8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Vertical step to next status
    if (currY !== nextY) {
      ctx.beginPath();
      ctx.moveTo(nextX, currY);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();
    }

    // Red dot + label
    ctx.beginPath();
    ctx.arc(currX, currY, 4, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.font = '10px Arial';
    ctx.fillText(curr.status, currX + 6, currY - 5);

    redDots.push({ x: currX, y: currY, label: `${curr.status}: ${curr.time}` });
  }

  // Last point
  const last = logData[logData.length - 1];
  const lastX = getX(last.rawTime);
  const lastY = 30 + (statusRowMap[last.status] ?? 0) * 30;

  ctx.beginPath();
  ctx.arc(lastX, lastY, 4, 0, 2 * Math.PI);
  ctx.fillStyle = 'red';
  ctx.fill();
  ctx.font = '10px Arial';
  ctx.fillText(last.status, lastX + 6, lastY - 5);
  redDots.push({ x: lastX, y: lastY, label: `${last.status}: ${last.time}` });

  // Tooltip behavior
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    let found = false;

    redDots.forEach((dot) => {
      if (Math.abs(mouseX - dot.x) < 6 && Math.abs(mouseY - dot.y) < 6) {
        tooltip.innerHTML = dot.label;
        tooltip.style.left = `${e.pageX + 10}px`;
        tooltip.style.top = `${e.pageY - 20}px`;
        tooltip.style.display = 'block';
        found = true;
      }
    });

    if (!found) tooltip.style.display = 'none';
  });

  return canvas.toDataURL();
};





  const downloadLog = (tripId, data) => {
  const headers = ['Time', 'Status', 'Notes'];
  const csvRows = [
    headers.join(','), // CSV Header
    ...data.map(entry =>
      [entry.time, entry.status, `"${entry.notes}"`].join(',')
    ),
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `eld-log-trip-${tripId}.csv`);
};


  return (
    <div className="home-container">
      <ToastContainer />
      <Sidebar />
      <div className="container">
        <h2 className="mb-4">📋 ELD Log Sheets</h2>
        {logs.map((log, idx) => (
          <div className="card mb-5 shadow" key={idx}>
            <div className="card-header bg-primary text-white">
              Trip #{log.tripId} — {log.date}
            </div>
            <div className="card-body">
              <p><strong>Route:</strong> {log.pickup} ➔ {log.dropoff}</p>
              <p><strong>Total Duration:</strong> {Number(log.duration).toFixed(2)} hrs</p>

              <h5 className="mt-4">🗂 Daily Log Graph</h5>
              <img src={drawGraph(log.logData)} alt="ELD Graph" className="img-fluid border my-3" />

              <h5 className="mt-4">📄 Log Details</h5>
              <table className="table table-bordered">
                <thead className="thead-light">
                  <tr>
                    <th scope="col">Time</th>
                    <th scope="col">Status</th>
                    <th scope="col">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {log.logData.map((entry, i) => (
                    <tr key={i}>
                      <td>{entry.time}</td>
                      <td>{entry.status}</td>
                      <td>{entry.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                className="btn btn-success btn-sm mt-3"
                onClick={() => downloadLog(log.tripId, log.logData)}
              >
                Download Log
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ELDLog;
