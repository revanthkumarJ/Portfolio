// import React, { useState } from 'react';
// import { Container, Form, Row, Col } from 'react-bootstrap';
// import ImportantCertificates from './ImportantCertificates';
// import AllCertificates from './AllCertificates';
// import SkillCertificates from './SkillCertificates';
// import EventCertificates from './EventCertificates';
// import Internships from './InternshipPage';

// function Certificates() {
//   const [selectedCertificateType, setSelectedCertificateType] = useState('all');

//   const handleCertificateTypeChange = (event) => {
//     setSelectedCertificateType(event.target.value);
//   };

//   return (
//     <Container style={{ padding: '20px', backgroundColor: '#121212', color: '#ffffff', borderRadius: '8px' }}>
//       {/* Title */}
//       <h2 className="project-heading" style={{ marginBottom: '30px', marginTop: '20px' }}>
//         {selectedCertificateType === 'important' ? 'Important Certifications' : 
//          selectedCertificateType === 'skill' ? 'All Skill Certificates' :
//          selectedCertificateType === 'event' ? 'All Event Certificates' :
//          selectedCertificateType === 'internships' ? 'Internships' :
//          'All Course Certificates'}
//       </h2>

//       {/* Radio buttons */}
//       <Form>
//         <Row className="mb-4" style={{ justifyContent: 'center' }}>
//           <Col xs="auto">
//             <Form.Check
//               type="radio"
//               label="Important Certificates"
//               name="certificateType"
//               value="important"
//               checked={selectedCertificateType === 'important'}
//               onChange={handleCertificateTypeChange}
//               style={{ color: 'white' }}
//             />
//           </Col>
//           <Col xs="auto">
//             <Form.Check
//               type="radio"
//               label="All Course Certificates"
//               name="certificateType"
//               value="all"
//               checked={selectedCertificateType === 'all'}
//               onChange={handleCertificateTypeChange}
//               style={{ color: 'white' }}
//             />
//           </Col>
//           <Col xs="auto">
//             <Form.Check
//               type="radio"
//               label="All Skill Certificates"
//               name="certificateType"
//               value="skill"
//               checked={selectedCertificateType === 'skill'}
//               onChange={handleCertificateTypeChange}
//               style={{ color: 'white' }}
//             />
//           </Col>
//           <Col xs="auto">
//             <Form.Check
//               type="radio"
//               label="All Events Certificates"
//               name="certificateType"
//               value="event"
//               checked={selectedCertificateType === 'event'}
//               onChange={handleCertificateTypeChange}
//               style={{ color: 'white' }}
//             />
//           </Col>
//           <Col xs="auto">
//             <Form.Check
//               type="radio"
//               label="Internships"
//               name="certificateType"
//               value="internships"
//               checked={selectedCertificateType === 'internships'}
//               onChange={handleCertificateTypeChange}
//               style={{ color: 'white' }}
//             />
//           </Col>
//         </Row>
//       </Form>

//       {/* Render certificate sections conditionally */}
//       {selectedCertificateType === 'important' ? (
//         <ImportantCertificates />
//       ) : selectedCertificateType === 'all' ? (
//         <AllCertificates />
//       ) : selectedCertificateType === 'skill' ? (
//         <SkillCertificates />
//       ) : selectedCertificateType === 'event' ? (
//         <EventCertificates />
//       ) : (
//         <Internships />
//       )}
//     </Container>
//   );
// }

// export default Certificates;
