import httpx
import json

BASE_URL = "http://127.0.0.1:8000"

def test_live_server():
    print("Testing live health endpoint...")
    with httpx.Client() as client:
        r = client.get(f"{BASE_URL}/health")
        assert r.status_code == 200, f"Health check failed: {r.text}"
        print(f"[PASS] Health check: {r.json()}")

        # 1. Test Fresher Resume Upload with Synonym-Rich Job Description
        print("\nTesting Fresher Resume Upload with Phase 4 Analysis...")
        with open("test_files/fresher_resume.docx", "rb") as f:
            files = {"resume": ("fresher_resume.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
            data = {
                "job_description": (
                    "Looking for a Backend / Full-Stack Engineer with experience in Python, FastAPI, React.js, "
                    "PostgreSQL (Postgres), Docker, AWS, and REST APIs. Experience with K8s and CI/CD is a plus. "
                    "Responsibilities include designing scalable microservices and optimizing database queries."
                )
            }
            r = client.post(f"{BASE_URL}/api/analyze", files=files, data=data)
            assert r.status_code == 200, f"Fresher upload failed: {r.text}"
            res = r.json()
            assert res["success"] is True
            assert res["ats_score"]["overall_score"] > 0
            assert res["experience_analysis"]["candidate_type"] == "fresher"
            assert res["experience_analysis"]["include_experience_section"] is False
            assert res["ai_insights"] is not None
            assert res["ai_insights"]["match_explanation"] is not None
            assert "overview" in res["ai_insights"]["match_explanation"]
            assert len(res["ai_insights"]["project_evaluations"]) >= 1
            assert res["ai_insights"]["prioritized_recommendations"] is not None

            print(f"[PASS] Fresher Analysis (Phase 4):")
            print(f"  - Overall ATS Score: {res['ats_score']['overall_score']} / 100 ({res['ats_score']['rating']})")
            print(f"  - Candidate Type: {res['experience_analysis']['candidate_type']}")
            print(f"  - AI Provider Status: {res['ai_insights'].get('provider_used')} (AI-Powered: {res['ai_insights']['is_ai_powered']})")
            print(f"  - Match Explanation: {res['ai_insights']['match_explanation']['overview'][:90]}...")
            print(f"  - Projects Evaluated: {len(res['ai_insights']['project_evaluations'])}")
            print(f"  - High Priority Recs: {len(res['ai_insights']['prioritized_recommendations']['high_priority'])}")
            print(f"  - Matching Skills: {res['skill_comparison']['matching_skills']}")
            print(f"  - Missing Skills: {res['skill_comparison']['missing_skills']}")

        # 2. Test Experienced Resume Upload
        print("\nTesting Experienced Resume Upload...")
        with open("test_files/experienced_resume.docx", "rb") as f:
            files = {"resume": ("experienced_resume.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
            data = {"job_description": "We are looking for a Senior Python Developer with FastAPI, PostgreSQL, Docker, AWS, and Microservices experience."}
            r = client.post(f"{BASE_URL}/api/analyze", files=files, data=data)
            assert r.status_code == 200, f"Experienced upload failed: {r.text}"
            res = r.json()
            assert res["success"] is True
            assert res["ats_score"]["overall_score"] > 0
            assert res["experience_analysis"]["candidate_type"] == "experienced"
            assert res["experience_analysis"]["include_experience_section"] is True
            print(f"[PASS] Experienced Analysis Success:")
            print(f"  - Overall ATS Score: {res['ats_score']['overall_score']} / 100 ({res['ats_score']['rating']})")
            print(f"  - Candidate Type: {res['experience_analysis']['candidate_type']}")
            print(f"  - Include Experience Section: {res['experience_analysis']['include_experience_section']}")
            print(f"  - Professional Work Items: {len(res['experience_analysis']['professional_items'])}")

        # 3. Test Optional Job Description Analysis (Upload without JD)
        print("\nTesting Optional Job Description Analysis (Without JD)...")
        with open("test_files/fresher_resume.docx", "rb") as f:
            files = {"resume": ("fresher_resume.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
            data = {"job_description": ""}
            r = client.post(f"{BASE_URL}/api/analyze", files=files, data=data)
            assert r.status_code == 200, f"Expected 200 for empty JD, got {r.status_code}: {r.text}"
            res_no_jd = r.json()
            assert res_no_jd["success"] is True
            assert res_no_jd["job_description_provided"] is False
            assert res_no_jd["ats_score"]["overall_score"] > 0
            print(f"[PASS] Optional JD analysis succeeded: ATS Score = {res_no_jd['ats_score']['overall_score']}")

        # 4. Test Missing Resume Validation
        print("\nTesting Missing Resume Validation...")
        data = {"job_description": "Some job description here"}
        r = client.post(f"{BASE_URL}/api/analyze", data=data)
        assert r.status_code == 400, f"Expected 400 for missing resume, got {r.status_code}"
        print(f"[PASS] Missing resume validation rejected properly: {r.json()['detail']}")

        # 5. Test Virtual Simulation & Multi-line Certifications Payload
        print("\nTesting Virtual Simulation & Multi-line Certifications Payload...")
        import docx
        doc = docx.Document()
        sim_resume_text = """JORDAN T. AVERY
Seattle, WA | 555-019-2834 | jordan.avery@example.com
LinkedIn: https://www.linkedin.com/in/jordan-avery-demo | GitHub: https://github.com/jordanavery-demo
EDUCATION
Pacific Northwest University of Technology
Bachelor of Science (Information Technology) | Graduating: 2027
TECHNICAL SKILLS
Languages: Python, JavaScript, C, HTML, CSS
Frameworks: Flask, React
Databases: PostgreSQL, MongoDB
Tools: Git, GitHub, VS Code, Postman
Core: OOP, DBMS, Operating Systems, Computer Networks
PROJECTS
• Cloud Document Analyzer – Built an automated document analysis platform that evaluates resumes against job descriptions, generates compatibility scores, provides role-specific and general feedback, and supports PDF resume uploads.
• Distributed CDN Simulator – Developed a Flask-based CDN simulator with origin server, regional edge nodes, intelligent routing, caching (TTL), failover, health monitoring, and an interactive dashboard demonstrating distributed system concepts.
• Real-time Stream Monitor – Built a Python application that detects video latency fluctuations and triggers alerts using computer vision concepts.
CERTIFICATIONS
• JPMorgan Chase & Co. – Software Engineering Job Simulation (Forage)
Completed practical tasks involving project setup, Kafka integration, H2 database integration, REST API integration, and REST API controllers in a simulated industry environment.
• Global Tech Skills Academy – AI Foundation
Learned fundamentals of AI, Generative AI essentials, prompt engineering basics, AI tools, and responsible AI through hands-on learning.
LANGUAGES
English | Spanish | French"""
        for line in sim_resume_text.splitlines():
            if line.strip():
                doc.add_paragraph(line)
        import io
        buf = io.BytesIO()
        doc.save(buf)
        buf.seek(0)

        files = {"resume": ("simulation_resume.docx", buf.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        data = {"job_description": "We are seeking a Python / React Software Engineer with experience in REST APIs, PostgreSQL, and Flask."}
        r = client.post(f"{BASE_URL}/api/analyze", files=files, data=data)
        assert r.status_code == 200, f"Simulation resume analysis failed: {r.text}"
        res_sim = r.json()
        assert res_sim["success"] is True
        assert res_sim["parsed_resume"]["name"] == "JORDAN T. AVERY"
        assert len(res_sim["parsed_resume"]["certifications"]) == 2
        assert res_sim["experience_analysis"]["has_virtual_experience"] is True
        assert res_sim["experience_analysis"]["has_professional_experience"] is False
        assert len(res_sim["experience_analysis"]["virtual_simulation_items"]) == 1
        sim_item = res_sim["experience_analysis"]["virtual_simulation_items"][0]
        assert "JPMorgan Chase & Co." in sim_item
        assert "Software Engineering Job Simulation (Forage)" in sim_item
        assert not sim_item.startswith("e Engineering")
        assert not sim_item.startswith("& Co.")
        print(f"[PASS] Virtual Simulation Resume Live API Analysis:")
        print(f"  - Overall ATS Score: {res_sim['ats_score']['overall_score']} / 100 ({res_sim['ats_score']['rating']})")
        print(f"  - Candidate Type: {res_sim['experience_analysis']['candidate_type']}")
        print(f"  - Virtual Simulation Items: {res_sim['experience_analysis']['virtual_simulation_items']}")
        print(f"  - Certifications: {len(res_sim['parsed_resume']['certifications'])}")

        # 6. Test Character-Spaced Synthetic PDF Resume Upload
        print("\nTesting Character-Spaced Synthetic PDF Resume Upload...")
        with open("test_files/synthetic_spaced_text_resume.pdf", "rb") as f:
            files = {"resume": ("synthetic_spaced_text_resume.pdf", f, "application/pdf")}
            data = {"job_description": "We are seeking a Python / Full-Stack Developer with experience in PostgreSQL, REST APIs, and Docker."}
            r = client.post(f"{BASE_URL}/api/analyze", files=files, data=data)
            assert r.status_code == 200, f"Spaced PDF resume analysis failed: {r.text}"
            res_pdf = r.json()
            assert res_pdf["success"] is True
            assert res_pdf["parsed_resume"]["name"] == "ALEX JOHNSON"
            assert "alex.johnson@example.com" in res_pdf["parsed_resume"]["email"]
            assert "Python" in res_pdf["parsed_resume"]["skills"]
            assert len(res_pdf["parsed_resume"]["parsed_projects"]) >= 1
            print(f"[PASS] Synthetic Spaced PDF Live API Analysis:")
            print(f"  - Overall ATS Score: {res_pdf['ats_score']['overall_score']} / 100 ({res_pdf['ats_score']['rating']})")
            print(f"  - Parsed Name: {res_pdf['parsed_resume']['name']}")
            print(f"  - Parsed Skills: {len(res_pdf['parsed_resume']['skills'])} skills detected")

    print("\nALL LIVE END-TO-END HTTP TESTS PASSED!")

if __name__ == "__main__":
    test_live_server()
