import { Leaf, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white mt-16">
      <div className="container-padding py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">AgriFert</span>
                <div className="text-xs text-emerald-400">Professional Solutions</div>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Your trusted partner in agricultural excellence. Providing premium fertilizers,
              pesticides, and expert guidance for optimal crop yield and sustainable farming.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm">About Us</a></li>
              <li><a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm">Products</a></li>
              <li><a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm">Services</a></li>
              <li><a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm">Support</a></li>
              <li><a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm">Contact</a></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Services</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm">Soil Testing</a></li>
              <li><a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm">Crop Consultation</a></li>
              <li><a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm">Pest Management</a></li>
              <li><a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm">Delivery Service</a></li>
              <li><a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm">Training Programs</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm">123 Agriculture Street, Farm City, FC 12345</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm">info@agrifert.com</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4 pt-4">
              <a href="#" className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-slate-400 text-sm">
              © 2024 AgriFert. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Terms of Service</a>
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer