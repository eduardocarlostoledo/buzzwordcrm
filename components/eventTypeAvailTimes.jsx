import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { PopupButton } from 'react-calendly';

export default () => {
  const location = useLocation().search;
  const eventUri = new URLSearchParams(location).get('event_type');
  const [eventType, setEventType] = useState([]);
  const [eventTypesSlots, seEventTypesSlots] = useState([]);
  const [date, setDate] = useState('');
  const [queryParams, setQueryParams] = useState();
  const [showTime, setShowTIme] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [finalDateMillisec, setFinalDateMillisec] = useState();

  const fetchEventTypeData = async () => {
    const uuid = eventUri.split('/')[4];
    const result = await fetch(`/api/event_types/${uuid}`).then((res) =>
      res.json()
    );

    setEventType(result.eventType);
  };

  const fetchEventTypeSlotsData = async (params) => {
    const result = await fetch(`/api/event_type_available_times${params}`).then(
      (res) => {
        //Daylight savings time issue, actually
        if(res.status === 500) {
          alert('This event cannot be scheduled so far in advance.');
      window.location.reload();
          return 
        } 
         return res.json()
        
        
      }
    );

    if (result.availableSlots.length === 0) {
      console.log("res is OK, length is 0")
      alert('This event cannot be scheduled so far in advance.');
      // window.location.reload();
    } 

    seEventTypesSlots(result.availableSlots);
  };

  console.log('eventTypesSlots=', eventTypesSlots)


  useEffect(() => {
    fetchEventTypeData();
  }, []);

  useEffect(() => {
    fetchEventTypeSlotsData();
  }, []);

  return (
    <div className="event-avail-selection-box">
      <h5>Check Availability for "{eventType.name}"</h5>
      <h6 className="event-type-avail-banner">
        Click below to see availability for this event type by start date
      </h6>
      <div>
        <strong>
          *Note: Time range will be 7 days from your chosen start date
        </strong>
      </div>
      <div className="date-picker-calendar">
        <DatePicker
          selected={date}
          placeholderText="CLICK HERE (selected date and time must be in the future)"
          minDate={new Date()}
          dateFormat="MMMM d, yyyy"
          onChange={(date) => {
            setDate(date);
            setShowTIme(true);
            let copyDate = new Date(date.getTime());
            let endDate = new Date(copyDate.setDate(copyDate.getDate() + 7));
            setFinalDateMillisec(new Date(date).getTime());
            setQueryParams(
              `?start_time=${date.toISOString()}&end_time=${endDate.toISOString()}&event_type=${eventUri}`
            );
          }}
        />
      </div>
      {showTime && (
        <div>
          <input
            type="time"
            id="selected-time"
            name="selected-time"
            defaultValue="--:--"
            step="900"
            onChange={(event) => {
              let dateToModify = date.toString().split(' ');
              let time = event.target.value;
              dateToModify[4] = time;
              let dateWithTime = new Date(dateToModify.join(' '));
              setDate(dateWithTime);
              let copyDate = new Date(dateWithTime.getTime());
              let endDate = new Date(copyDate.setDate(copyDate.getDate() + 7));
              setShowSubmit(true);
              setFinalDateMillisec(new Date(dateWithTime).getTime());
              setQueryParams(
                `?start_time=${dateWithTime.toISOString()}&end_time=${endDate.toISOString()}&event_type=${eventUri}`
              );
            }}
          ></input>
        </div>
      )}
      {showSubmit && finalDateMillisec > new Date().getTime() && (
        <button
          onClick={() => {
            if (finalDateMillisec > new Date().getTime()) {
              fetchEventTypeSlotsData(queryParams);
              // if(eventTypesSlots === undefined) {
              //   //setTooFarInAdvanceClicked(true)
              //   alert('This event cannot be scheduled so far in advance.')
              //   //window.location.reload();
              // }
            } 
            // else if (eventTypesSlots === undefined) {
            //   //setTooFarInAdvanceClicked(true)
            //   alert('This event cannot be scheduled so far in advance.')
            //   //window.location.reload();
            // }
            else {
              alert('Date/time selection must be in the future.');
            }
          }}
        >
          Submit
        </button>
      )}
      <div className="event-type-availability">
        {eventTypesSlots && eventTypesSlots.length ? (
          <div className="row">
            <table className="striped centered">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>Invitees Remaining</th>
                  <th>Status</th>
                  <th>Scheduling Link</th>
                </tr>
              </thead>
              {eventTypesSlots && (
                <tbody>
                  {eventTypesSlots.map((slot, i) => (
                    <tr key={i}>
                      <td>{slot.date}</td>
                      <td>{slot.standard_start_time_hour}</td>
                      <td>{slot.invitees_remaining}</td>
                      <td>{`${slot.status
                        .substring(0, 1)
                        .toUpperCase()}${slot.status.substring(1)}`}</td>
                      <td className="card-action">
                        <PopupButton
                          url={slot.scheduling_url}
                          rootElement={document.getElementById('root')}
                          text="Book this time slot"
                          styles={{
                            borderWidth: 0,
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        ) : (
          ''
        )}
      </div>
    </div>
  );
};
