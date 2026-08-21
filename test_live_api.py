import httpx
import json

BASE_URL = "http://127.0.0.1:8000"

def test_live_server():
    print("Testing live health endpoint...")
    with httpx.Client() as client:
        r = client.get(f"{BASE_URL}/health")
        assert r.status_code == 200, f"Health check failed: {r.text}"
        print(f"[PASS] Health check: {r.json()}")

        # 1. Test Fresher Resume Upload
        print("\nTesting Fresher Resume Upload...")
        with open("test_files/fresher_resume.docx", "rb") as f:
            files = {"resume": ("fresher_resume.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
            data = {"job_description": "We are looking for a Python Developer with experience in FastAPI, Docker, PostgreSQL, AWS, and REST APIs."}
            r = client.post(f"{BASE_URL}/api/analyze", files=files, data=data)
            assert r.status_code == 200, f"Fresher upload failed: {r.text}"
            res = r.json()
            assert res["success"] is True
            assert res["ats_score"]["overall_score"] > 0
            assert res["experience_analysis"]["candidate_type"] == "fresher"
            assert res["experience_analysis"]["include_experience_section"] is False
            print(f"[PASS] Fresher Analysis Success:")
            print(f"  - Overall ATS Score: {res['ats_score']['overall_score']} / 100 ({res['ats_score']['rating']})")
            print(f"  - Candidate Type: {res['experience_analysis']['candidate_type']}")
            print(f"  - Include Experience Section: {res['experience_analysis']['include_experience_section']}")
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
            print(f"[PASS] Optional JD analysis succeeded: ATS Score = {res_no_jd['ats_score']['overall_score']}")

        # 4. Test Missing Resume Validation
        print("\nTesting Missing Resume Validation...")
        data = {"job_description": "Some job description here"}
        r = client.post(f"{BASE_URL}/api/analyze", data=data)
        assert r.status_code == 400, f"Expected 400 for missing resume, got {r.status_code}"
        print(f"[PASS] Missing resume validation rejected properly: {r.json()['detail']}")

    print("\nALL LIVE END-TO-END HTTP TESTS PASSED!")

if __name__ == "__main__":
    test_live_server()
