// import React from 'react';
// import { Row, Col, Card } from 'react-bootstrap';

// function CertificateSection({ title, certificates }) {
//     return (
//         <div style={{ marginBottom: '40px' }}>
//             <h2 className="project-heading" style={{ marginTop: '40px' }}>
//                 {title}
//             </h2>
//             <Row style={{ justifyContent: 'center', paddingBottom: '20px' }}>
//                 {certificates.map((cert, index) => (
//                     <Col md={6} key={index} className="project-card">
//                         <Card className="project-card-view">
//                             <Card.Body>
//                                 {/* Certificate Image */}
//                                 <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
//                                     <img
//                                         src={cert.image}
//                                         alt={cert.name}
//                                         style={{
//                                             width: '100%',
//                                             height: 'auto',
//                                             maxHeight: '200px',
//                                             objectFit: 'contain',
//                                             borderRadius: '8px',
//                                             boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
//                                         }}
//                                     />
//                                 </div>

//                                 {/* Certificate Name */}
//                                 <Card.Title
//                                     style={{
//                                         color: 'white',
//                                         fontWeight: 'bold',
//                                         textAlign: 'center',
//                                     }}
//                                 >
//                                     {cert.name}
//                                 </Card.Title>

//                                 {/* Issued By & Issued On */}
//                                 <p style={{ color: 'white', textAlign: 'center', marginBottom: '6px' }}>
//                                     <strong>Issued By:</strong> {cert.issuedBy}
//                                 </p>
//                                 <p style={{ color: 'white', textAlign: 'center' }}>
//                                     <strong>Issued On:</strong> {cert.issuedOn}
//                                 </p>

//                                 {/* Verify Link */}
//                                 {cert.verifyLink && (
//                                     <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
//                                         <a
//                                             href={cert.verifyLink}
//                                             target="_blank"
//                                             rel="noopener noreferrer"
//                                             className="btn btn-outline-info btn-sm"
//                                         >
//                                             Verify
//                                         </a>
//                                     </div>
//                                 )}
//                             </Card.Body>
//                         </Card>
//                     </Col>
//                 ))}
//             </Row>
//         </div>
//     );
// }

// export default CertificateSection;
