import { motion } from "framer-motion";
import { BookOpen, User, MapPin, Calendar } from "lucide-react";

const ProjectInfo = () => (
  <section id="about" className="py-20 bg-card/30 border-t border-border">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          About This <span className="text-primary text-glow">Project</span>
        </h2>
      </motion.div>

      <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
        {[
          { icon: BookOpen, label: "Faculty", value: "Information Communication Technology" },
          { icon: User, label: "Department", value: "Computer Science" },
          { icon: MapPin, label: "Institution", value: "Ruaha Catholic University (RUCU)" },
          { icon: Calendar, label: "Date", value: "February 2026" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-4 p-5 rounded-lg border border-border bg-card"
          >
            <item.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-sm font-medium text-foreground">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="max-w-3xl mx-auto mt-10 p-6 rounded-lg border border-border bg-card"
      >
        <h3 className="font-semibold text-foreground mb-3">Abstract</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This project designs and implements a unified cyber security framework integrating system security, 
          web application security, and network security into one platform. The framework collects logs from all layers, 
          correlates events in real time, and sends quick alerts using Design Science Research methodology 
          and open-source tools tested in a safe lab environment. Expected results include faster threat detection, 
          lower management costs, and quicker response to attacks.
        </p>
      </motion.div>
    </div>
  </section>
);

export default ProjectInfo;
