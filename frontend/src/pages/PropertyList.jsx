import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, Plus, FileText, Search, Loader2, ArrowRight, X, MapPin, Award } from 'lucide-react';
import apiClient from '../api/client';
import { RiskBadge } from '../components/RiskBadge';
import { PropertyImage } from '../components/PropertyImage';
import { PROPERTY_IMAGES, getPropertyImage } from '../utils/propertyImages';

export const PropertyList = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  // Form State
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [surveyNumber, setSurveyNumber] = useState('');
  const [village, setVillage] = useState('');
  const [taluk, setTaluk] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Karnataka');
  const [areaExtent, setAreaExtent] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProperties = async () => {
    try {
      const res = await apiClient.get('/properties');
      setProperties(res.data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.post('/properties', {
        title,
        address,
        survey_number: surveyNumber,
        village,
        taluk,
        district,
        state,
        area_extent: areaExtent
      });
      setShowModal(false);
      setTitle('');
      setAddress('');
      setSurveyNumber('');
      setVillage('');
      setTaluk('');
      setDistrict('');
      setAreaExtent('');
      fetchProperties();
    } catch (err) {
      alert("Failed to create property.");
    } finally {
      setCreating(false);
    }
  };

  const filteredProps = properties.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.survey_number && p.survey_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#0F172A] tracking-tight">Managed Properties</h1>
          <p className="text-xs text-slate-500 font-medium">Create properties and upload land deeds for automated AI analysis.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-bold text-xs transition-colors shadow-md shadow-blue-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Property</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search properties by title, survey number, or location..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 shadow-xs"
        />
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0D9488]" />
          <p className="text-xs">Loading property records...</p>
        </div>
      ) : filteredProps.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-extrabold text-[#0F172A] text-sm">No properties match your filter.</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Try adjusting your search query or add a new property record.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProps.map((prop, idx) => (
            <Link
              key={prop.id}
              to={`/properties/${prop.id}`}
              className="prop-card bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-[#2563EB] transition-all block group"
            >
              {/* Image Banner */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <PropertyImage
                  src={getPropertyImage(idx)}
                  alt={prop.title}
                  fallbackType="property"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-mono font-bold bg-[#0F172A]/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-full border border-white/20">
                    {prop.property_id_code || `PRP-${prop.id}`}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <RiskBadge level={prop.overall_risk_level} size="sm" />
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-extrabold text-base line-clamp-1">{prop.title}</h3>
                  <p className="text-[11px] text-slate-200 flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#CCFBF1]" />
                    <span className="line-clamp-1">{prop.address || `${prop.village || ''}, ${prop.district || ''}`}</span>
                  </p>
                </div>
              </div>

              {/* Property Card Details */}
              <div className="p-5 space-y-3">
                <div className="space-y-1 text-xs text-slate-600">
                  <p><span className="font-bold text-slate-900">Survey No:</span> {prop.survey_number || 'Unspecified'}</p>
                  <p><span className="font-bold text-slate-900">Extent:</span> {prop.area_extent || '2,400 sq.ft'}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span>{prop.document_count || 0} Docs</span>
                  </span>

                  <span className="text-[#2563EB] font-extrabold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Property Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-[#0F172A] text-base flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-[#2563EB]" />
                <span>Create New Property Record</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">Property Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Greenfield Enclave Plot 42"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">Survey Number</label>
                  <input
                    type="text"
                    value={surveyNumber}
                    onChange={(e) => setSurveyNumber(e.target.value)}
                    placeholder="e.g. 142/3B"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">Area / Extent</label>
                  <input
                    type="text"
                    value={areaExtent}
                    onChange={(e) => setAreaExtent(e.target.value)}
                    placeholder="e.g. 2,400 sq.ft"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">Address / Schedule Details</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot No, Street, Landmark"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Village</label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="Hoodi"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Taluk</label>
                  <input
                    type="text"
                    value={taluk}
                    onChange={(e) => setTaluk(e.target.value)}
                    placeholder="Bengaluru East"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Bengaluru Urban"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 shadow-md"
                >
                  {creating ? 'Creating...' : 'Create Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
